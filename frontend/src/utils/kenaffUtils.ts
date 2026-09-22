export interface ComplaintData {
  caseId: string;
  category: string;
  createdAt: string;
  description: string;
}

export const KENAFF_CONTACTS = {
  primaryPhone: '+254723903957',
  primaryPhoneDisplay: '+254 723 903 957',
  alternativePhone: '+254741461763',
  alternativePhoneDisplay: '+254 741 461 763',
  email: 'farmers@kenaff.org',
  website: 'https://www.kenaff.org/',
  contactUsUrl: 'https://www.kenaff.org/contact-us.php'
};

export const generateComplaintSummary = (complaint: ComplaintData): string => {
  const categoryDisplay = complaint.category.replace(/_/g, ' ');
  const dateDisplay = new Date(complaint.createdAt).toLocaleDateString();

  return `MavunoTrust Case ID: ${complaint.caseId}
Category: ${categoryDisplay}
Date Reported: ${dateDisplay}

Complaint:
${complaint.description}

I am seeking assistance regarding this matter.`;
};

export const generateMailtoLink = (complaint: ComplaintData): string => {
  const subject = `MavunoTrust Farmer Complaint - ${complaint.caseId}`;
  const body = `Dear KENAFF,

I am seeking assistance regarding a farming-related problem.

${generateComplaintSummary(complaint)}

Thank you.`;

  return `mailto:${KENAFF_CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
