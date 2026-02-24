module.exports = {
  "plans": [
    {
      "id": "starter-lite",
      "name": "Starter Lite Plan",
      "pricing": "$2 per student per month",
      "priceType": "per-student",
      "price": 2,
      "userCapacity": null,
      "minUsers": 1,
      "maxUsers": null,
      "features": [
        "Ideal for small schools or those just starting with our platform",
        "Pay only for the number of students enrolled, making it a cost-effective solution as your school grows",
        "Scalability: Pay only for the number of students enrolled"
      ]
    },
    {
      "id": "business",
      "name": "Business Plan",
      "pricing": "$100 per month",
      "priceType": "fixed",
      "price": 100,
      "userCapacity": 2000,
      "minUsers": 1,
      "maxUsers": 2000,
      "features": [
        "Comprehensive set of tools for managing school operations, suitable for medium-sized institutions",
        "User Capacity: Supports up to 2,000 users",
        "Cost Efficiency: Fixed monthly fee provides predictable budgeting for schools with larger student bodies"
      ]
    },
    {
      "id": "enterprise",
      "name": "Enterprise Plan",
      "pricing": "$150 per month",
      "priceType": "fixed",
      "price": 150,
      "userCapacity": 4000,
      "minUsers": 2001,
      "maxUsers": 4000,
      "features": [
        "Tailored solutions for larger educational institutions that require advanced functionalities and scalability",
        "User Capacity: Supports between 2,000 and 4,000 users",
        "Flexible Support: Enjoy dedicated support and additional customization options to fit your unique institutional needs"
      ]
    },
    {
      "id": "premium",
      "name": "Premium Plan",
      "pricing": "$300 per month",
      "priceType": "fixed",
      "price": 300,
      "userCapacity": 10000,
      "minUsers": 4001,
      "maxUsers": 10000,
      "features": [
        "Designed for large educational institutions needing extensive user support and advanced features",
        "User Capacity: Supports between 4,000 and 10,000 users",
        "Enhanced Customization: Access premium support and additional functionalities to cater to high-demand environments"
      ]
    }
  ]
};
