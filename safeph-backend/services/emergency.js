const db = require('../config/database');

async function sendSOSAlerts(userId, emergencyId, location) {
  // TODO: integrate real SMS / push services.
  console.log('Sending SOS alerts for user', userId, 'emergency', emergencyId, 'loc', location);
  return { sms: true, push: true, contacts_notified: 0 };
}

async function findNearestResponders(location) {
  const { latitude, longitude } = location;
  const result = await db.query(
    'SELECT * FROM find_nearest_responders($1, $2, $3, $4)',
    [latitude, longitude, 50, 5]
  );
  return result.rows.map((r) => ({
    name: r.organization_name,
    distance: `${r.distance_km.toFixed(1)} km`,
    eta: '10 minutes',
    contact: r.phone_number
  }));
}

module.exports = { sendSOSAlerts, findNearestResponders };
