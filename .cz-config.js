module.exports = {
  types: [
    { value: 'feat', name: 'feat:     A new feature' },
    { value: 'fix', name: 'fix:      A bug fix' },
    { value: 'docs', name: 'docs:     Documentation only changes' },
    {
      value: 'cleanup',
      name:
        'cleanup:  A code change that neither fixes a bug nor adds a feature'
    },
    {
      value: 'chore',
      name: "chore:    Other changes that don't modify src or test files"
    }
  ],
  scopes: [
    { name: 'nx-serverless', description: 'anything nx-serverless specific' },
    {
      name: 'core',
      description: 'anything infrastructure as a code core specific'
    },
    { name: 'docs', description: 'anything related to docs infrastructure' },
    { name: 'nx-aws-cdk', description: 'anything aws-cdk specific' },
    { name: 'angular', description: 'anything angular specific' },
    { name: 'scully-plugin-angular-delay', description: 'anything scully-plugin-angular-delay specific' },
    { name: 'scully-plugin-google-analytics', description: 'anything scully-plugin-google-analytics specific' },
    { name: 'scully-plugin-lazy-load-picture-tag', description: 'anything scully-plugin-lazy-load-picture-tag specific' },
    { name: 'node', description: 'anything Node specific' },
    { name: 'linter', description: 'anything Linter specific' },
    {
      name: 'testing',
      description: 'anything testing specific (e.g., jest or cypress)'
    },
    {
      name: 'repo',
      description: 'anything related to managing the repo itself'
    },
    { name: 'misc', description: 'misc stuff' }
  ],

  allowTicketNumber: true,
  isTicketNumberRequired: false,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberRegExp: '\\d{1,5}',
  // override the messages, defaults are as follows
  messages: {
    type: "Select the type of change that you're committing:",
    scope: '\nDenote the SCOPE of this change (optional):',
    // used if allowCustomScopes is true
    customScope: 'Denote the SCOPE of this change:',
    subject:
      'Write a SHORT, IMPERATIVE (lowercase) description of the change:\n',
    body:
      'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: 'List any BREAKING CHANGES (optional):\n',
    footer:
      'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above?'
  },
  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix'],
  // skip any questions you want
  skipQuestions: ['ticketNumber'],
  // limit subject length
  subjectLimit: 100
  // breaklineChar: '|', // It is supported for fields body and footer.
  // footerPrefix : 'ISSUES CLOSED:'
  // askForBreakingChangeFirst : true, // default is false
};
