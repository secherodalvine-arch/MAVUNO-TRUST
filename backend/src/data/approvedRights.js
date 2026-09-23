export const APPROVED_RIGHTS = [
    {
        id: 'right-to-info',
        title: 'Right to Information',
        explanation: 'You should be able to understand relevant information affecting your dealings and understand how your information is being used by the platform.',
        whyItMatters: 'Clear information helps you make better decisions and understand your rights and responsibilities before committing to a transaction.',
        officialSource: 'Official source information will be added after verification.',
        textId: 'rights_info'
    },
    {
        id: 'privacy',
        title: 'Privacy',
        explanation: 'Your personal information should be handled responsibly. MavunoTrust keeps your private financial and personal information separate from public profiles.',
        whyItMatters: 'Protecting your data prevents misuse and ensures that you have control over who sees your private information.',
        officialSource: 'Official source information will be added after verification.',
        textId: 'rights_privacy'
    },
    {
        id: 'fair-dealings',
        title: 'Fair and Informed Business Dealings',
        explanation: 'You should be able to understand important information about a proposed agricultural transaction before making a decision. Note that MavunoTrust does not guarantee a particular outcome or price.',
        whyItMatters: 'Transparency before a transaction helps prevent misunderstandings and ensures you know what you are agreeing to.',
        officialSource: 'Official source information will be added after verification.',
        textId: 'rights_fairness'
    },
    {
        id: 'seek-remedy',
        title: 'Right to Seek Remedy',
        explanation: 'When you have a problem or dispute, you should be able to understand the available complaint or remedy pathways. MavunoTrust provides a reporting tool, but does not replace courts, regulators, or government agencies.',
        whyItMatters: 'Knowing how to seek help ensures that disputes can be addressed properly, whether on the platform or through official institutions.',
        officialSource: 'Official source information will be added after verification.',
        textId: 'rights_remedy'
    }
];
export const getApprovedRightsContentString = () => {
    return APPROVED_RIGHTS.map(r => `--- ${r.title} ---\nExplanation: ${r.explanation}\nWhy it matters: ${r.whyItMatters}\nSource: ${r.officialSource}`).join('\n\n');
};
