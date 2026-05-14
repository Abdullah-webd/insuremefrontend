import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const policies = {
  car: {
    "policy_name": "Car Insurance",
    "description": "Covers damages or loss to your car due to accidents, theft, fire, or natural disasters.",
    "coverage": {
      "accidents": "Covers collision, impact, and third-party liability.",
      "theft": "Covers full or partial theft of the car.",
      "fire": "Covers damages caused by fire, explosions, or lightning.",
      "natural_disasters": "Covers damages caused by floods, storms, earthquakes, or hail."
    },
    "exclusions": [
      "Intentional damage caused by the owner",
      "Driving under influence of alcohol/drugs",
      "Racing or reckless driving"
    ],
    "user_responsibilities": [
      "Provide valid driver’s license and vehicle registration",
      "Provide recent photos of the car",
      "Report incidents within 24 hours"
    ]
  },
  health: {
    "policy_name": "Health Insurance",
    "description": "Covers medical expenses incurred due to illness, accidents, or preventive care.",
    "coverage": {
      "hospitalization": "Covers room charges, ICU, and surgical procedures.",
      "medication": "Covers prescribed drugs and diagnostic tests.",
      "maternity": "Covers pre and postnatal care, subject to waiting periods."
    },
    "exclusions": [
      "Pre-existing conditions (unless stated otherwise)",
      "Cosmetic procedures",
      "Self-inflicted injuries"
    ],
    "user_responsibilities": [
      "Use network hospitals for cashless treatment",
      "Provide accurate medical history",
      "Notify the insurer within 48 hours of emergency admission"
    ]
  },
  house: {
    "policy_name": "House Insurance",
    "description": "Covers damages to your home and its contents from fire, theft, or natural disasters.",
    "coverage": {
      "structure": "Covers the building against fire, vandalism, and storms.",
      "contents": "Covers furniture, electronics, and appliances against theft or damage.",
      "liability": "Covers legal liabilities if someone is injured on your property."
    },
    "exclusions": [
      "Wear and tear or lack of maintenance",
      "Termite or pest damage",
      "Intentional destruction"
    ],
    "user_responsibilities": [
      "Maintain the property in good condition",
      "Install basic security measures",
      "Report incidents within 48 hours"
    ]
  },
  life: {
    "policy_name": "Life Insurance",
    "description": "Provides financial security to your beneficiaries in the event of your passing.",
    "coverage": {
      "death_benefit": "Lump-sum payment to beneficiaries upon the policyholder’s death.",
      "terminal_illness": "Early payout if diagnosed with a terminal illness with less than 12 months to live."
    },
    "exclusions": [
      "Suicide within the first two years of the policy",
      "Death due to participation in illegal activities",
      "Undeclared pre-existing health conditions"
    ],
    "user_responsibilities": [
      "Pay premiums on time",
      "Provide accurate health information during application",
      "Update beneficiary details as needed"
    ]
  }
};

export default function PolicyPage() {
  const { type } = useParams();
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    if (policies[type]) {
      setPolicy(policies[type]);
    }
  }, [type]);

  if (!policy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-500">Policy not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-red-800 px-6 py-8">
          <h1 className="text-3xl font-bold text-white">{policy.policy_name} Policy</h1>
          <p className="mt-2 text-red-100">{policy.description}</p>
        </div>
        
        <div className="px-6 py-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">Coverage</h2>
            <div className="space-y-4">
              {Object.entries(policy.coverage).map(([key, value]) => (
                <div key={key}>
                  <h3 className="text-lg font-medium text-gray-800 capitalize">{key.replace('_', ' ')}</h3>
                  <p className="text-gray-600 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">Exclusions</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              {policy.exclusions.map((exclusion, index) => (
                <li key={index}>{exclusion}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">Your Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              {policy.user_responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
