// Controller for exposing subscription plans
const { getPlans, savePlans } = require('../config/subscriptionPlans');

exports.getSubscriptionPlans = (req, res) => {
  res.json({ plans: getPlans() });
};

// Only superadmin should be able to call this (add auth middleware in route)
exports.updateSubscriptionPlans = (req, res) => {
  const { plans } = req.body;
  if (!Array.isArray(plans)) {
    return res.status(400).json({ error: 'Plans must be an array.' });
  }
  savePlans(plans);
  res.json({ success: true, plans });
};
