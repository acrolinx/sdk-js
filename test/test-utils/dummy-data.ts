import {DictionaryScope} from '../../src';
import {AudienceStatus, CheckingCapabilities, CheckType, ContentEncoding, ReportType} from '../../src/capabilities';
import {CheckResult, DocumentQualityStatus} from '../../src/check';

export const DUMMY_CAPABILITIES: CheckingCapabilities = {
  audiences: [
    {
      id: 'aud-1',
      displayName: 'Tom the Technical Type',
      language: {
        displayName: 'English (Great Britain)',
        id: 'en',
      },
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
          displayName: 'Switches'
        },
        {
          displayName: 'Acrolinx'
        }
      ],
      status: AudienceStatus.ready
    },
    {
      id: 'aud-2',
      displayName: 'Randolf Redakteur',
      language: {
        displayName: 'German',
        id: 'en',
      },
      goals: [{
        id: 'spelling',
        displayName: 'Spelling',
        color: '#f21'
      }],
      termSets: [],
      status: AudienceStatus.loading
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
  reportTypes: ['scorecard.xml', 'scorecard.html', 'debug', 'termharvesting'] as ReportType[],
  platformExtensions: []
};


export const DUMMY_CHECK_RESULT: CheckResult = {
  id: '153',
  dictionaryScopes: [DictionaryScope.language, DictionaryScope.audience, DictionaryScope.document],
  checkOptions: {
    audienceId: 'aud_1',
    reportTypes: [
      ReportType.debug,
      ReportType.termharvesting
    ],
    contentFormat: 'word_xml',
    checkType: CheckType.interactive,
    partialCheckRanges: [
      {
        begin: 10,
        end: 20
      },
      {
        begin: 40,
        end: 70
      }
    ]
  },
  document: {
    id: '283ab1e075f21a',
    reference: 'C:\\abc.docx',
    mimeType: 'application/word',
    author: 'Ralf',
    contentType: 'E-Mail',
    metadata: [
      {
        displayName: 'Project ID',
        key: 'projectId',
        value: 'Marketing Campaign',
        required: true
      }
    ],
    displayInfo: {
      reference: 'abc.docx'
    }
  },
  quality: {
    score: 57,
    status: DocumentQualityStatus.red
    // TODO: which values are allowed?
  },
  counts: {
    sentences: 10,
    words: 121,
    issues: 15
  },
  goals: [
    {
      id: 'spelling',
      displayName: 'Spelling',
      color: '#f21',
      issueCount: 13
    },
    {
      id: 'voice.readability',
      displayName: 'Clarity',
      color: '#f22',
      issueCount: 2
    },
    {
      id: 'term.unsuitable',
      displayName: 'Unsuitable Term',
      color: '#f23',
      issueCount: 0
    }
  ],
  issues: [
    {
      issueId: '1',
      goalId: 'spelling',
      internalName: 'title_case_chicago',
      displayName: 'Use Chicago style for the title case?',
      guidance: '<div class="shortHelp" lang="en" xml:lang="en">\n<p>According to' +
      " the <q>Chicago Manual of Style</q>, here's how you write titles:</p>\n<ul>\n" +
      '<li>Capitalize the first word and the last word.</li>\n<li>Capitalize all "main" words.</li>\n' +
      "<li>Don't capitalize articles and conjunctions (example: <q>a</q>, <q>and</q>).</li>\n" +
      "<li>Don't capitalize prepositions independent of their length (example: <q>about</q>, <q>around</q>).</li>\n" +
      '</ul>\n</div>',
      extractedSurface: 'zentense',
      positionalInformation: {
        hashes: {
          // TODO: positional info? groupId grouped flags based on type (e.g. all flags of a rule),
          // but issue hash just groups internalName+extractedSurface
          issue: 'BhKh3iaGBjB7Cw6M/GwrLQ==',
          environment: 'vJ9eCVViEpIdM76h+5K/nA==',
          index: 'hjlRLT0K+LlvlslKdNUlhw==1'
        },
        matches: [
          {
            extractedPart: 'zen',
            extractedBegin: 30,
            extractedEnd: 33,
            originalPart: 'zen',
            originalBegin: 19247,
            originalEnd: 19255
          },
          {
            extractedPart: 'te',
            extractedBegin: 33,
            extractedEnd: 35,
            originalPart: '&te;',
            originalBegin: 19250,
            originalEnd: 19254
          },
          {
            extractedPart: 'nse',
            extractedBegin: 35,
            extractedEnd: 38,
            originalPart: 'nse',
            originalBegin: 19254,
            originalEnd: 19257
          }
        ]
      },
      readonly: true,
      issueLocations: [
        {
          locationId: 'pageLocation',
          displayName: 'Page 4',
          values: {
            page: '4'
          }
        }
      ],
      suggestions: [
        {
          surface: 'sentence',
          groupId: 'sentence',
          replacements: ['sen', null, 'nce']
        }
      ],
      actions: [
        {
          id: 'help',
          url: 'https://tenant.acrolinx.cloud/htmldata/en/rules/help/title_case_chicago.html',
          displayName: 'Help',
          icon: 'help-icon'
        },
        {
          id: 'termContributionForm',
          url: 'https://tenant.acrolinx.cloud/termcontribution.html?surface=@@base64:cXdlcnR5dWlvcA==&' +
          'locale=en&language=en&userid=admin&context=@@base64:VGhpcyBzZW50ZW5jZSBoYXMgYSBxd2VydHl1aW9wLg==#',
          displayName: 'Add as Term',
          icon: 'icon-term-contribute',
          replacedBy: 'termContribution'
        }
      ],
      links: {
        termContribution: 'https://tenant.acrolinx.cloud/terminology/v7/rest/contribute',
        addToDictionary: 'https://tenant.acrolinx.cloud/api/v1/dictionary/submit'
      }
    },
    {
      issueId: '2',
      goalId: 'term.unsuitable',
      internalName: 'term_flag',
      displayName: '<b>Illegal sublanguage variant</b> of preferred term',
      guidance: '<div class="guidance term">\n\t<b>Domains</b>\n\t\t\t<br/><i>Switches</i>\n\t\t\t\t\t<br/>\n' +
      '\t\t<b>Note</b>\n\t\t<br/>\n\t\tUse &#39;please&#39; in presale materials only. Do NOT use &#39;please&#39; ' +
      'in postsale material.\n\t</div>\n',
      extractedSurface: 'Please',
      positionalInformation: {
        hashes: {
          issue: '3qyt/AVxwNTOUQSuMA7brw==',
          environment: 'TiwIFBwA6X920mDAezJTyQ==',
          index: 'Lm9PqBGGm+tj21rt3pkpjA==1'
        },
        matches: [
          {
            extractedPart: 'Please',
            extractedBegin: 766,
            extractedEnd: 772,
            originalPart: 'Please',
            originalBegin: 28223,
            originalEnd: 28229
          }
        ]
      },
      readonly: false,
      issueLocations: [],
      suggestions: [
        {
          surface: 'blablub',
          icon: 'https://tenant.acrolinx.cloud/tng/icons/preferred.svg',
          // TODO: icon class+url?
          groupId: '2653',
          replacements: ['blablub']
        }
      ],
      actions: [
        {
          id: 'help',
          url: 'https://tenant.acrolinx.cloud/termhelp?termUniversalId=9c2e9ffb-a314-4b61-94b2-d62db3c18945&locale=en',
          displayName: 'Help',
          icon: 'help-icon'
        }
      ],
      debug: {
        term: {
          surface: 'please',
          status: 'DEPRECATED',
          termSets: [
            'RA-Terms'
          ],
          domains: [
            'RA-Terms'
          ],
          variant: 'legalVariantIllegal'
        }
      }
    },
    {
      issueId: '3-sub-1',
      goalId: 'voice.readability',
      internalName: 'en-clarity-medium',
      displayName: 'Too complex? Your readers need a medium level of clarity. ',
      guidance: '',
      extractedSurface: 'Reports ... length',
      positionalInformation: {
        hashes: {
          issue: 'E3OxJ3bFcfWLyAisUxufAA==',
          environment: 'XVYQZVyCoFOr1TDeyXuMgg==',
          index: 'accsS0dbn/3rafcbT9NJGw==1'
        },
        matches: [
          {
            extractedPart: 'Reports',
            extractedBegin: 1360,
            extractedEnd: 1367,
            originalPart: 'Reports',
            originalBegin: 33173,
            originalEnd: 33180
          },
          {
            extractedPart: 'length',
            extractedBegin: 1749,
            extractedEnd: 1755,
            originalPart: 'length',
            originalBegin: 33562,
            originalEnd: 33568
          }
        ]
      },
      suggestions: [],
      issueLocations: [],
      readonly: false,
      debug: {
        penalty: 1234.0967741949999
      },
      subIssues: [
        {
          issueId: '3-1',
          goalId: 'voice.readability',
          internalName: 'phenomenon_embedded_or_complex_sentence',
          displayName: 'Try to split up this sentence.',
          guidance: "<p>This sentence doesn't seem to flow smoothly. We found a few embedded phrases in there " +
          'that could be messing with your flow somehow.</p>',
          extractedSurface: 'Reports ... length',
          positionalInformation: {
            hashes: {
              issue: '7s1nqUN96X+P6VY4FlfSQQ==',
              environment: 'XVYQZVyCoFOr1TDeyXuMgg==',
              index: '++0c1Z/OQu1Mwzt0KpkYYA==1'
            },
            matches: [
              {
                extractedPart: 'Reports',
                extractedBegin: 1360,
                extractedEnd: 1367,
                originalPart: 'Reports',
                originalBegin: 33173,
                originalEnd: 33180
              },
              {
                extractedPart: 'length',
                extractedBegin: 1749,
                extractedEnd: 1755,
                originalPart: 'length',
                originalBegin: 33562,
                originalEnd: 33568
              }
            ]
          },
          suggestions: [],
          issueLocations: [],
          readonly: false,
          debug: {
            penalty: 320.0
          }
        },
        {
          issueId: '3-2',
          goalId: 'voice.readability',
          internalName: 'phenomenon_passive',
          displayName: 'The active voice is usually clearer.',
          guidance: "<p>This one could do with a bit of pep. It's probably because it feels kind of passive. " +
          "We love it when you're assertive.</p>",
          extractedSurface: 'was first seen',
          positionalInformation: {
            hashes: {
              issue: 'dg+ih1XodWeL7lJ/wo17QQ==',
              environment: 'XVYQZVyCoFOr1TDeyXuMgg==',
              index: 'fOJLASZHiwnwcJWcfbkXnw==1'
            },
            matches: [
              {
                extractedPart: 'Reports',
                extractedBegin: 1360,
                extractedEnd: 1367,
                originalPart: 'Reports',
                originalBegin: 33173,
                originalEnd: 33180
              }
            ]
          },
          suggestions: [],
          issueLocations: [],
          readonly: false,
          debug: {
            penalty: 40.0
          }
        }
      ]
    }
  ],
  keywords: {
    links: {
      getTargetKeywords: 'https://tenant.acrolinx.cloud/services/v1/rest/findability/targetKeywords?' +
      'contextId=C%3A%5CUsers%5Cgrabowski%5CDesktop%5Ccloud-linguistic-smoketest.docx',
      putTargetKeywords: 'https://tenant.acrolinx.cloud/services/v1/rest/findability/targetKeywords?' +
      'contextId=C%3A%5CUsers%5Cgrabowski%5CDesktop%5Ccloud-linguistic-smoketest.docx'
    },
    discovered: [
      {
        keyword: 'Clarity card',
        sortKey: '10',
        density: 0.2546269436736127,
        count: 4,
        prominence: 0.0,
      }
    ],
    target: []
  },
  extraInfos: [
    {
      id: 'rioseo',
      title: 'IBM KIS',
      iconClass: 'search-icon',
      iconUrl: '...',
      url: 'https://kis.example.com/info?projectId=52351235'
    }
  ],
  reports:
    {
      scorecard: {
        linkAuthenticated: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.html',
        link: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.html'
      },
      legacyJson: {
        linkAuthenticated: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.json',
        link: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.json'
      },
    },
  actions: [
    {
      id: 'termContributionForm',
      url: 'https://tenant.acrolinx.cloud/termcontribution.html',
      displayName: 'Add as Term',
      icon: 'icon-term-contribute',
      replacedBy: 'termContribution'
    }
  ],
  analysisResults: {},
  links: {
    termContribution: 'https://tenant.acrolinx.cloud/terminology/rest/v7/contribute',
    deleteScorecard: 'https://tenant.acrolinx.cloud/api/v1/checking/153/result'
  }
};

