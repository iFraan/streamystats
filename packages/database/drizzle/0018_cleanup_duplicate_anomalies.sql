-- Custom SQL migration file, put your code below! --

-- Delete duplicate new_location/new_country anomalies (keep oldest by id)
-- This fixes duplicates created when multiple activities from the same new location
-- were processed before fingerprints were updated
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, server_id, anomaly_type, 
        details->'currentLocation'->>'city',
        details->'currentLocation'->>'country'
      ORDER BY id
    ) as rn
  FROM anomaly_events
  WHERE anomaly_type IN ('new_location', 'new_country')
)
DELETE FROM anomaly_events 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Delete duplicate new_device anomalies (keep oldest by id)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, server_id, anomaly_type, 
        details->>'deviceId'
      ORDER BY id
    ) as rn
  FROM anomaly_events
  WHERE anomaly_type = 'new_device'
)
DELETE FROM anomaly_events 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
