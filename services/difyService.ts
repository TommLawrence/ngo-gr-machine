
import { WorkflowInputs, WorkflowResponse, FeedbackPayload, AdminFeedbackRecord } from '../types.ts';

/**
 * NGO Grant Reporting Intelligence Service
 * Powered by Dify.ai Workflows
 */

// Dify API Configuration
const DIFY_API_URL = "https://api.dify.ai/v1";
const DIFY_API_KEY_MAIN = "app-3zLS58cv1zM63JGuxCFpEFkT";
const DIFY_API_KEY_FEEDBACK = "app-oIIRBboL0WQc3nEXESfSk7Om";

/**
 * Main Content Generation: Runs the Grant Reporting Workflow via Dify.ai.
 */
export const runGrantWorkflow = async (
  inputs: WorkflowInputs,
  userId: string,
  onProgress: (message: string) => void,
  onChunk?: (chunk: string) => void
): Promise<WorkflowResponse> => {
  
  onProgress("Connecting to Dify Intelligence Hub...");

  try {
    const response = await fetch(`${DIFY_API_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_API_KEY_MAIN}`
      },
      body: JSON.stringify({
        inputs: {
          field_notes_text: inputs.field_notes_text,
          donor_type: inputs.donor_type,
          language: inputs.language,
          style: inputs.style,
          voice_note_present: !!inputs.field_notes_voice,
          file_attachment_present: !!inputs.field_notes_file
        },
        response_mode: onChunk ? 'streaming' : 'blocking',
        user: userId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Dify API error: ${response.status}`);
    }

    if (onChunk && response.body) {
      onProgress("Synthesizing report based on donor specifications...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReport = "";
      let taskId = `ngo-run-${Date.now()}`;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5));
            
            // Handle different Dify event types
            if (data.event === 'text_chunk' && data.data?.text) {
              const text = data.data.text;
              fullReport += text;
              onChunk(text);
            } else if (data.event === 'workflow_finished') {
              taskId = data.workflow_run_id || taskId;
              if (data.data?.outputs?.markdown_report) {
                // If it finished and we didn't get all text via chunks
                if (!fullReport) {
                   fullReport = data.data.outputs.markdown_report;
                   onChunk(fullReport);
                }
              }
            } else if (data.event === 'node_started') {
              onProgress(`Processing: ${data.data?.node_name || 'Workflow Logic'}...`);
            }
          } catch (e) {
            console.warn("Error parsing Dify stream line", e);
          }
        }
      }

      onProgress("Analysis complete. Finalizing draft...");
      return {
        task_id: taskId,
        workflow_id: 'ngo-reporting-main',
        status: 'succeeded',
        outputs: {
          markdown_report: fullReport,
          executive_summary: `Synthesized ${inputs.donor_type} report`
        }
      };
    } else {
      const data = await response.json();
      onProgress("Analysis complete. Finalizing draft...");
      return {
        task_id: data.workflow_run_id || `ngo-run-${Date.now()}`,
        workflow_id: 'ngo-reporting-main',
        status: 'succeeded',
        outputs: {
          markdown_report: data.data?.outputs?.markdown_report || "Report generated successfully.",
          executive_summary: data.data?.outputs?.executive_summary || `Draft for ${inputs.donor_type}`
        }
      };
    }

  } catch (error: any) {
    console.error('Workflow Error:', error);
    throw new Error(error.message || 'The reporting engine is temporarily unavailable.');
  }
};

/**
 * Sends feedback data to the Dify 'Feedback Processor' workflow.
 */
export const sendFeedbackToDify = async (payload: FeedbackPayload, userId: string): Promise<any> => {
  try {
    const response = await fetch(`${DIFY_API_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_API_KEY_FEEDBACK}`
      },
      body: JSON.stringify({
        inputs: {
          workflow_run_id: payload.workflow_run_id,
          draft_id: payload.draft_id,
          donor_type: payload.donor_type,
          style: payload.style,
          transcription_correct: payload.transcription_correct,
          tone_rating: payload.tone_rating,
          auditor_note: payload.auditor_note,
          feedback_type: payload.feedback_type,
          submitted_at: payload.submitted_at
        },
        response_mode: 'blocking',
        user: userId
      })
    });

    // Persist locally for "Audit Logs" regardless of sync status
    const existing = localStorage.getItem('ngo_feedback_logs');
    const logs = existing ? JSON.parse(existing) : [];
    logs.push({ ...payload, userId });
    localStorage.setItem('ngo_feedback_logs', JSON.stringify(logs.slice(-100)));

    if (!response.ok) {
      console.warn('Dify remote submission failed.');
      return { status: 'partial_success', error: 'Remote sync failed' };
    }

    return { status: 'success' };
  } catch (err) {
    console.error('Feedback Persistence Error:', err);
    return { status: 'local_only', error: 'Network error during sync' };
  }
};

export const fetchFeedbackReview = async (userId: string): Promise<AdminFeedbackRecord[]> => {
  try {
    const existing = localStorage.getItem('ngo_feedback_logs');
    if (!existing) return [];
    
    const logs: (FeedbackPayload & { userId: string })[] = JSON.parse(existing);
    
    return logs.map(log => ({
      workflow_run_id: log.workflow_run_id,
      submitted_at: log.submitted_at,
      donor_type: log.donor_type,
      style: log.style,
      transcription_correct: log.transcription_correct,
      tone_rating: log.tone_rating,
      auditor_note: log.auditor_note
    }));
  } catch (err) {
    console.error('Audit Log Retrieval Error:', err);
    throw new Error('Could not retrieve organization audit records.');
  }
};
