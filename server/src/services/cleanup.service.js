import { pool } from '../config/db.js';

/**
 * Purges rows whose 24-hour retention window has passed:
 *  - analyses, resumes and job_descriptions with expires_at in the past
 *  - resumes and job_descriptions that were never analysed and are older
 *    than 24 hours (an upload that was never analysed)
 * Logs the deleted counts. Catches and logs errors; never throws.
 */
export async function purgeExpired() {
  try {
    const analyses = await pool.query(
      'DELETE FROM analyses WHERE expires_at IS NOT NULL AND expires_at < now() RETURNING id',
    );
    const resumes = await pool.query(
      'DELETE FROM resumes WHERE expires_at IS NOT NULL AND expires_at < now() RETURNING id',
    );
    const jobs = await pool.query(
      'DELETE FROM job_descriptions WHERE expires_at IS NOT NULL AND expires_at < now() RETURNING id',
    );
    // Never-analysed uploads: older than 24 hours and no analysis references them.
    const orphanResumes = await pool.query(
      `DELETE FROM resumes r
       WHERE r.expires_at IS NULL
         AND r.uploaded_at < now() - interval '24 hours'
         AND NOT EXISTS (SELECT 1 FROM analyses a WHERE a.resume_id = r.id)
       RETURNING id`,
    );
    const orphanJobs = await pool.query(
      `DELETE FROM job_descriptions j
       WHERE j.expires_at IS NULL
         AND j.created_at < now() - interval '24 hours'
         AND NOT EXISTS (SELECT 1 FROM analyses a WHERE a.job_description_id = j.id)
       RETURNING id`,
    );

    const counts = {
      analyses: analyses.rowCount,
      resumes: resumes.rowCount,
      jobDescriptions: jobs.rowCount,
      orphanResumes: orphanResumes.rowCount,
      orphanJobDescriptions: orphanJobs.rowCount,
    };
    if (Object.values(counts).some((n) => n > 0)) {
      console.log('[cleanup] purged expired rows:', JSON.stringify(counts));
    }
    return counts;
  } catch (err) {
    console.error('[cleanup] purgeExpired failed:', err.message);
    return null;
  }
}
