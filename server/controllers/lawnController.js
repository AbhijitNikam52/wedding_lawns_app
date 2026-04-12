// ─── Lawn Controller — Day 5 ─────────────────────────────
// This file will be fully built on Day 5 of the sprint.
// Placeholder so routes don't break on startup.

const getAllLawns  = async (req, res) => res.json({ message: "GET /lawns — coming Day 5" });
const getLawnById  = async (req, res) => res.json({ message: "GET /lawns/:id — coming Day 5" });
const createLawn   = async (req, res) => res.json({ message: "POST /lawns — coming Day 5" });
const updateLawn   = async (req, res) => res.json({ message: "PUT /lawns/:id — coming Day 5" });
const deleteLawn   = async (req, res) => res.json({ message: "DELETE /lawns/:id — coming Day 5" });
const getMyLawns   = async (req, res) => res.json({ message: "GET /lawns/owner/my-lawns — coming Day 5" });

module.exports = { getAllLawns, getLawnById, createLawn, updateLawn, deleteLawn, getMyLawns };
