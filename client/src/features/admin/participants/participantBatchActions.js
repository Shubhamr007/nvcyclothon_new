import { adminRequest, adminDownload } from "../../../api/http";

/**
 * Executes chunked generation & dispatch of rider passes.
 */
export async function executeBatchRiderPasses({
  targetIds,
  adminKey,
  onProgress,
  batchSize = 10,
}) {
  try {
    const totalCount = targetIds.length;
    let totalQueued = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    const totalBatches = Math.ceil(totalCount / batchSize);
    for (let i = 0; i < totalCount; i += batchSize) {
      const batchIds = targetIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const currentProcessed = Math.min(i + batchSize, totalCount);
      const percent = Math.round((currentProcessed / totalCount) * 100);

      onProgress?.({
        current: currentProcessed,
        total: totalCount,
        percent,
        label:
          totalBatches > 1
            ? `Generating passes: batch ${batchNumber}/${totalBatches} (${currentProcessed}/${totalCount})...`
            : `Generating & emailing ${totalCount} rider pass${totalCount === 1 ? "" : "es"}...`,
      });

      const result = await adminRequest("/registrations/rider-passes/generate", adminKey, {
        method: "POST",
        timeoutMs: 120000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchIds),
      });

      totalQueued += result.queued || 0;
      totalSent += result.sent_ids?.length || 0;
      totalFailed += result.failed_ids?.length || 0;
      totalSkipped += (result.skipped || 0) + (result.missing_ids?.length || 0);
    }

    return { totalQueued, totalSent, totalFailed, totalSkipped, totalCount };
  } catch (error) {
    console.error("executeBatchRiderPasses error:", error);
    throw error;
  }
}

/**
 * Executes chunked generation & dispatch of certificates.
 */
export async function executeBatchCertificates({
  targetIds,
  adminKey,
  onProgress,
  batchSize = 10,
}) {
  try {
    const totalCount = targetIds.length;
    let totalQueued = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    const totalBatches = Math.ceil(totalCount / batchSize);
    for (let i = 0; i < totalCount; i += batchSize) {
      const batchIds = targetIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const currentProcessed = Math.min(i + batchSize, totalCount);
      const percent = Math.round((currentProcessed / totalCount) * 100);

      onProgress?.({
        current: currentProcessed,
        total: totalCount,
        percent,
        label:
          totalBatches > 1
            ? `Generating certificates: batch ${batchNumber}/${totalBatches} (${currentProcessed}/${totalCount})...`
            : `Generating & emailing ${totalCount} certificate${totalCount === 1 ? "" : "s"}...`,
      });

      const result = await adminRequest("/registrations/certificates/generate", adminKey, {
        method: "POST",
        timeoutMs: 120000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchIds),
      });

      totalQueued += result.queued || 0;
      totalSent += result.sent_ids?.length || 0;
      totalFailed += result.failed_ids?.length || 0;
      totalSkipped += (result.skipped || 0) + (result.missing_ids?.length || 0);
    }

    return { totalQueued, totalSent, totalFailed, totalSkipped, totalCount };
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
