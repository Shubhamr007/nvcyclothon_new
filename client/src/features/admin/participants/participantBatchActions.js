import { adminRequest, adminDownload } from "../../../api/http";
import { fetchAdminJob } from "../../../api/jobs";

async function pollJobProgress(jobId, adminKey, totalCount, labelPrefix, onProgress) {
  let job = null;
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      job = await fetchAdminJob(adminKey, jobId);
    } catch (err) {
      console.warn("Poll job error:", err);
      break;
    }
    if (!job) break;

    const percent = job.progress || 0;
    const current = Math.round((percent / 100) * totalCount);
    onProgress?.({
      current,
      total: totalCount,
      percent,
      label:
        job.status === "completed"
          ? `${labelPrefix} completed successfully!`
          : `${labelPrefix} in background: ${percent}%...`,
    });

    if (["completed", "failed", "cancelled"].includes(job.status)) {
      break;
    }
  }
  return job;
}

/**
 * Executes durable background generation & dispatch of rider passes.
 */
export async function executeBatchRiderPasses({
  targetIds,
  adminKey,
  onProgress,
}) {
  try {
    const totalCount = targetIds.length;
    onProgress?.({
      current: 0,
      total: totalCount,
      percent: 5,
      label: `Queuing durable rider pass job for ${totalCount} rider${totalCount === 1 ? "" : "es"}...`,
    });

    const result = await adminRequest("/registrations/rider-passes/generate", adminKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetIds),
    });

    if (result.job_id) {
      const finalJob = await pollJobProgress(
        result.job_id,
        adminKey,
        totalCount,
        "Generating rider passes",
        onProgress
      );

      const jobResult = finalJob?.result || {};
      return {
        totalQueued: jobResult.queued ?? result.queued ?? totalCount,
        totalSent: jobResult.sent_ids?.length ?? result.queued ?? totalCount,
        totalFailed: jobResult.failed_ids?.length ?? 0,
        totalSkipped: (jobResult.skipped ?? result.skipped ?? 0) + (jobResult.missing_ids?.length ?? result.missing_ids?.length ?? 0),
        totalCount,
      };
    }

    return {
      totalQueued: result.queued || 0,
      totalSent: result.sent_ids?.length || 0,
      totalFailed: result.failed_ids?.length || 0,
      totalSkipped: (result.skipped || 0) + (result.missing_ids?.length || 0),
      totalCount,
    };
  } catch (error) {
    console.error("executeBatchRiderPasses error:", error);
    throw error;
  }
}

/**
 * Executes durable background generation & dispatch of certificates.
 */
export async function executeBatchCertificates({
  targetIds,
  adminKey,
  onProgress,
}) {
  try {
    const totalCount = targetIds.length;
    onProgress?.({
      current: 0,
      total: totalCount,
      percent: 5,
      label: `Queuing durable certificate job for ${totalCount} participant${totalCount === 1 ? "" : "s"}...`,
    });

    const result = await adminRequest("/registrations/certificates/generate", adminKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetIds),
    });

    if (result.job_id) {
      const finalJob = await pollJobProgress(
        result.job_id,
        adminKey,
        totalCount,
        "Generating certificates",
        onProgress
      );

      const jobResult = finalJob?.result || {};
      return {
        totalQueued: jobResult.queued ?? result.queued ?? totalCount,
        totalSent: jobResult.sent_ids?.length ?? result.queued ?? totalCount,
        totalFailed: jobResult.failed_ids?.length ?? 0,
        totalSkipped: (jobResult.skipped ?? result.skipped ?? 0) + (jobResult.missing_ids?.length ?? result.missing_ids?.length ?? 0),
        totalCount,
      };
    }

    return {
      totalQueued: result.queued || 0,
      totalSent: result.sent_ids?.length || 0,
      totalFailed: result.failed_ids?.length || 0,
      totalSkipped: (result.skipped || 0) + (result.missing_ids?.length || 0),
      totalCount,
    };
  } catch (error) {
    console.error("executeBatchCertificates error:", error);
    throw error;
  }
}

/**
 * Fetches PDF preview blob for rider pass.
 */
export async function fetchRiderPassBlob(riderId, adminKey) {
  try {
    return await adminDownload(`/registrations/${riderId}/rider-pass-preview`, adminKey);
  } catch (error) {
    console.error("fetchRiderPassBlob error:", error);
    throw error;
  }
}

/**
 * Fetches PDF preview blob for certificate.
 */
export async function fetchCertificateBlob(riderId, adminKey) {
  try {
    return await adminDownload(`/registrations/${riderId}/certificate-preview`, adminKey);
  } catch (error) {
    console.error("fetchCertificateBlob error:", error);
    throw error;
  }
}

/**
 * Uploads custom certificate file for selected rider IDs.
 */
export async function uploadCustomCertificates({ targetIds, certificateFile, adminKey }) {
  try {
    const body = new FormData();
    body.append("registration_ids", JSON.stringify(targetIds));
    body.append("certificate_file", certificateFile);

    return await adminRequest("/registrations/certificates", adminKey, {
      method: "POST",
      body,
    });
  } catch (error) {
    console.error("uploadCustomCertificates error:", error);
    throw error;
  }
}
