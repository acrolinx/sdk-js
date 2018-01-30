import {AudienceStatus, Capabilities, CheckType, ContentEncoding, ReportType} from '../../src/capabilities';

export const DUMMY_CAPABILITIES: Capabilities = {
  audiences: [
    {
      id: 'aud-1',
      displayName: 'Tom the Technical Type',
      language: 'en_GB',
      goals: ['spelling', 'voice.readability', 'term.unsuitable', 'term.admitted'],
      termSets: ['c58f3889-9466-4fb4-82c7-973a0b4644d9', 'e57bf41b-c706-495c-8664-1020fac9cffb'],
      status: AudienceStatus.ready
    },
    {
      id: 'aud-2',
      displayName: 'Randolf Redakteur',
      language: 'de',
      goals: ['spelling'],
      termSets: [],
      status: AudienceStatus.loading
    }
  ],
  languages: [
    {
      id: 'en_GB',
      displayName: 'English (Great Britain)'
    },
    {
      id: 'de',
      displayName: 'German'
    }
  ],
  goals: [
    {
      id: 'spelling',
      displayName: 'Spelling',
      color: '#f21'
    },
    {
      id: 'voice.readability',
      displayName: 'Clarity',
      color: '#f22'
    },
    {
      id: 'term.unsuitable',
      displayName: 'Unsuitable Term',
      color: '#f23'
    },
    {
      id: 'term.admitted',
      displayName: 'Use with caution',
      color: '#f24'
    }
  ],
  termSets: [
    {
      id: 'c58f3889-9466-4fb4-82c7-973a0b4644d9',   // actually the T+ term filter UUID
      displayName: 'Switches'
    },
    {
      id: 'e57bf41b-c706-495c-8664-1020fac9cffb',
      displayName: 'Acrolinx'
    }
  ],
  contentFormats: [
    {
      id: 'auto',
      displayName: 'Automatic Detection',   // TODO: what do we do with this again?
      extensions: ['*']                     // TODO: what do we do with this again?
    },
    {
      id: 'text',
      displayName: 'Plain Text',
      extensions: ['txt']
    },
    {
      id: 'markdown',
      displayName: 'Markdown',
      extensions: ['md']
    },
    {
      id: 'xml',
      displayName: 'XML',
      extensions: ['xml', 'dita', 'docbook']
    },
    {
      id: 'word_xml',
      displayName: 'XML (MS Word 2003)',
      extensions: ['xml']
    }
  ],
  contentEncodings: ['none', 'zip,base64', 'base64'] as ContentEncoding[],
  checkTypes: ['batch', 'partial', 'interactive'] as CheckType[],
  reportTypes: ['scorecard.xml', 'scorecard.html', 'debug', 'termharvesting'] as ReportType[]
};
