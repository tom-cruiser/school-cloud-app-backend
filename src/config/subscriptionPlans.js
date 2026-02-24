// Subscription plan logic for School Cloud SaaS
const path = require('path');
const fs = require('fs');
const DATA_PATH = path.join(__dirname, 'subscriptionPlans.data.js');

function getPlans() {
  // eslint-disable-next-line
  delete require.cache[require.resolve(DATA_PATH)];
  return require(DATA_PATH).plans;
}

function savePlans(plans) {
  const data = { plans };
  fs.writeFileSync(DATA_PATH, 'module.exports = ' + JSON.stringify(data, null, 2) + ';\n');
}

module.exports = { getPlans, savePlans };
