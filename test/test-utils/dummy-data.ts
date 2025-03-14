/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DictionaryScope, IssueType, SuggestionIconId } from '../../src';
import {
  CheckingCapabilities,
  CheckType,
  ContentEncoding,
  GuidanceProfileStatus,
  ReportType,
} from '../../src/capabilities';
import { CheckResult, DocumentQualityStatus } from '../../src/check';

const GOAL_VOICE_ID = 'voice.readability';
const GOAL_TERM_ID = 'term.unsuitable';

export const DUMMY_AI_REWRITE_CONTEXT = [
  {
    part: 'This',
    begin: 0,
    end: 4,
  },
  {
    part: ' ',
    begin: 4,
    end: 5,
  },
  {
    part: 'is',
    begin: 5,
    end: 7,
  },
  {
    part: ' ',
    begin: 7,
    end: 8,
  },
  {
    part: 'new',
    begin: 8,
    end: 11,
  },
  {
    part: ' ',
    begin: 11,
    end: 12,
  },
  {
    part: 'document',
    begin: 12,
    end: 20,
  },
  {
    part: '.',
    begin: 20,
    end: 21,
  },
  {
    part: ' ',
    begin: 21,
    end: 22,
  },
  {
    part: 'This',
    begin: 22,
    end: 26,
  },
  {
    part: ' ',
    begin: 26,
    end: 27,
  },
  {
    part: 'is',
    begin: 27,
    end: 29,
  },
  {
    part: ' ',
    begin: 29,
    end: 30,
  },
  {
    part: 'not',
    begin: 30,
    end: 33,
  },
  {
    part: ' ',
    begin: 33,
    end: 34,
  },
  {
    part: 'acceptable',
    begin: 34,
    end: 44,
  },
];

export const DUMMY_CAPABILITIES: CheckingCapabilities = {
  guidanceProfiles: [
    {
      id: 'aud-1',
      displayName: 'Tom the Technical CustomFieldType',
      language: {
        displayName: 'English (Great Britain)',
        id: 'en',
      },
      goals: [
        {
          id: 'spelling',
          displayName: 'Spelling',
          color: '#f21',
        },
        {
          id: GOAL_VOICE_ID,
          displayName: 'Clarity',
          color: '#f22',
        },
        {
          id: GOAL_TERM_ID,
          displayName: 'Unsuitable Term',
          color: '#f23',
        },
        {
          id: 'term.admitted',
          displayName: 'Use with caution',
          color: '#f24',
        },
      ],
      termSets: [
        {
          displayName: 'Switches',
        },
        {
          displayName: 'Acrolinx',
        },
      ],
      status: GuidanceProfileStatus.ready,
    },
    {
      id: 'aud-2',
      displayName: 'Randolf Redakteur',
      language: {
        displayName: 'German',
        id: 'en',
      },
      goals: [
        {
          id: 'spelling',
          displayName: 'Spelling',
          color: '#f21',
        },
      ],
      termSets: [],
      status: GuidanceProfileStatus.loading,
    },
  ],
  contentFormats: [
    {
      id: 'auto',
      displayName: 'Automatic Detection', // TODO: what do we do with this again?
    },
    {
      id: 'text',
      displayName: 'Plain Text',
    },
    {
      id: 'markdown',
      displayName: 'Markdown',
    },
    {
      id: 'xml',
      displayName: 'XML',
    },
    {
      id: 'word_xml',
      displayName: 'XML (MS Word 2003)',
    },
  ],
  contentEncodings: ['none', 'zip,base64', 'base64'] as ContentEncoding[],
  checkTypes: ['batch', 'partial', 'interactive'] as CheckType[],
  reportTypes: [ReportType.scorecard, ReportType.extractedText, ReportType.termHarvesting],
  referencePattern: 'someRegex',
};

const ENVIRONMENT_HASH = 'XVYQZVyCoFOr1TDeyXuMgg==';

export const DUMMY_CHECK_RESULT: CheckResult = {
  id: '153',
  dictionaryScopes: [DictionaryScope.language, DictionaryScope.guidanceProfile, DictionaryScope.document],
  checkOptions: {
    guidanceProfileId: 'aud_1',
    reportTypes: [ReportType.termHarvesting],
    contentFormat: 'word_xml',
    checkType: CheckType.interactive,
    partialCheckRanges: [
      {
        begin: 10,
        end: 20,
      },
      {
        begin: 40,
        end: 70,
      },
    ],
  },
  document: {
    id: '283ab1e075f21a',
    displayInfo: {
      reference: 'abc.docx',
    },
    customFields: [],
  },
  quality: {
    score: 57,
    status: DocumentQualityStatus.red,
    // TODO: which values are allowed?
  },
  counts: {
    sentences: 10,
    words: 121,
    issues: 15,
  },
  goals: [
    {
      id: 'spelling',
      displayName: 'Spelling',
      color: '#f21',
      issues: 13,
    },
    {
      id: GOAL_VOICE_ID,
      displayName: 'Clarity',
      color: '#f22',
      issues: 2,
    },
    {
      id: GOAL_TERM_ID,
      displayName: 'Unsuitable Term',
      color: '#f23',
      issues: 0,
    },
  ],
  issues: [
    {
      aiRephraseHint: '',
      aiRewriteContext: DUMMY_AI_REWRITE_CONTEXT,
      canAddToDictionary: true,
      goalId: 'spelling',
      guidelineId: 'spelling',
      issueType: IssueType.actionable,
      internalName: 'title_case_chicago',
      displayNameHtml: 'Use Chicago style for the title case?',
      guidanceHtml: `<div class="shortHelp" lang="en" xml:lang="en">\n<p>According to
       the <q>Chicago Manual of Style</q>, here's how you write titles:</p>\n<ul>
      <li>Capitalize the first word and the last word.</li>\n<li>Capitalize all "main" words.</li>
      <li>Don't capitalize articles and conjunctions (example: <q>a</q>, <q>and</q>).</li>
      <li>Don't capitalize prepositions independent of their length (example: <q>about</q>, <q>around</q>).</li>
      </ul>\n</div>`,
      displaySurface: 'zentense',
      positionalInformation: {
        hashes: {
          // TODO: positional info? groupId grouped flags based on type (e.g. all flags of a rule),
          // but issue hash just groups internalName+extractedSurface
          issue: 'BhKh3iaGBjB7Cw6M/GwrLQ==',
          environment: 'vJ9eCVViEpIdM76h+5K/nA==',
          index: 'hjlRLT0K+LlvlslKdNUlhw==1',
        },
        matches: [
          {
            extractedPart: 'zen',
            extractedBegin: 30,
            extractedEnd: 33,
            originalPart: 'zen',
            originalBegin: 19247,
            originalEnd: 19255,
          },
          {
            extractedPart: 'te',
            extractedBegin: 33,
            extractedEnd: 35,
            originalPart: '&te;',
            originalBegin: 19250,
            originalEnd: 19254,
          },
          {
            extractedPart: 'nse',
            extractedBegin: 35,
            extractedEnd: 38,
            originalPart: 'nse',
            originalBegin: 19254,
            originalEnd: 19257,
          },
        ],
      },
      readOnly: true,
      issueLocations: [
        {
          locationId: 'pageLocation',
          displayName: 'Page 4',
          values: {
            page: '4',
          },
        },
      ],
      suggestions: [
        {
          surface: 'sentence',
          groupId: 'sentence',
          replacements: ['sen', null, 'nce'],
        },
      ],
      links: {
        help: 'https://www.help.org',
        termContribution: 'https://tenant.acrolinx.cloud/terminology/v7/rest/contribute',
        addToDictionary: 'https://tenant.acrolinx.cloud/api/v1/dictionary/submit',
      },
    },
    {
      aiRephraseHint: '',
      aiRewriteContext: DUMMY_AI_REWRITE_CONTEXT,
      canAddToDictionary: true,
      goalId: GOAL_TERM_ID,
      issueType: IssueType.actionable,
      internalName: 'term_flag',
      displayNameHtml: '<b>Illegal sublanguage variant</b> of preferred term',
      guidanceHtml: `<div class="guidance term">\n\t<b>Domains</b>\n\t\t\t<br/><i>Switches</i>\n\t\t\t\t\t<br/>
      \t\t<b>Note</b>\n\t\t<br/>\n\t\tUse &#39;please&#39; in presale materials only. Do NOT use &#39;please&#39;
      in postsale material.\n\t</div>\n`,
      displaySurface: 'Please',
      positionalInformation: {
        hashes: {
          issue: '3qyt/AVxwNTOUQSuMA7brw==',
          environment: 'TiwIFBwA6X920mDAezJTyQ==',
          index: 'Lm9PqBGGm+tj21rt3pkpjA==1',
        },
        matches: [
          {
            extractedPart: 'Please',
            extractedBegin: 766,
            extractedEnd: 772,
            originalPart: 'Please',
            originalBegin: 28223,
            originalEnd: 28229,
          },
        ],
      },
      readOnly: false,
      issueLocations: [],
      suggestions: [
        {
          surface: 'blablub',
          iconId: SuggestionIconId.preferred,
          groupId: '2653',
          replacements: ['blablub'],
        },
      ],
      debug: {
        term: {
          surface: 'please',
          status: 'DEPRECATED',
          termSets: ['RA-Terms'],
          domains: ['RA-Terms'],
          variant: 'legalVariantIllegal',
        },
      },
    },
    {
      aiRephraseHint: '',
      aiRewriteContext: DUMMY_AI_REWRITE_CONTEXT,
      canAddToDictionary: true,
      goalId: GOAL_VOICE_ID,
      issueType: IssueType.actionable,
      internalName: 'en-clarity-medium',
      displayNameHtml: 'Too complex? Your readers need a medium level of clarity. ',
      guidanceHtml: '',
      displaySurface: 'Reports ... length',
      positionalInformation: {
        hashes: {
          issue: 'E3OxJ3bFcfWLyAisUxufAA==',
          environment: ENVIRONMENT_HASH,
          index: 'accsS0dbn/3rafcbT9NJGw==1',
        },
        matches: [
          {
            extractedPart: 'Reports',
            extractedBegin: 1360,
            extractedEnd: 1367,
            originalPart: 'Reports',
            originalBegin: 33173,
            originalEnd: 33180,
          },
          {
            extractedPart: 'length',
            extractedBegin: 1749,
            extractedEnd: 1755,
            originalPart: 'length',
            originalBegin: 33562,
            originalEnd: 33568,
          },
        ],
      },
      suggestions: [],
      issueLocations: [],
      readOnly: false,
      debug: {
        penalty: 1234.0967741949999,
      },
      subIssues: [
        {
          aiRephraseHint: '',
          aiRewriteContext: DUMMY_AI_REWRITE_CONTEXT,
          canAddToDictionary: true,
          goalId: GOAL_VOICE_ID,
          issueType: IssueType.actionable,
          internalName: 'phenomenon_embedded_or_complex_sentence',
          displayNameHtml: 'Try to split up this sentence.',
          guidanceHtml:
            "<p>This sentence doesn't seem to flow smoothly. We found a few embedded phrases in there " +
            'that could be messing with your flow somehow.</p>',
          displaySurface: 'Reports ... length',
          positionalInformation: {
            hashes: {
              issue: '7s1nqUN96X+P6VY4FlfSQQ==',
              environment: ENVIRONMENT_HASH,
              index: '++0c1Z/OQu1Mwzt0KpkYYA==1',
            },
            matches: [
              {
                extractedPart: 'Reports',
                extractedBegin: 1360,
                extractedEnd: 1367,
                originalPart: 'Reports',
                originalBegin: 33173,
                originalEnd: 33180,
              },
              {
                extractedPart: 'length',
                extractedBegin: 1749,
                extractedEnd: 1755,
                originalPart: 'length',
                originalBegin: 33562,
                originalEnd: 33568,
              },
            ],
          },
          suggestions: [],
          issueLocations: [],
          readOnly: false,
          debug: {
            penalty: 320.0,
          },
        },
        {
          aiRephraseHint: '',
          aiRewriteContext: DUMMY_AI_REWRITE_CONTEXT,
          canAddToDictionary: true,
          goalId: GOAL_VOICE_ID,
          issueType: IssueType.actionable,
          internalName: 'phenomenon_passive',
          displayNameHtml: 'The active voice is usually clearer.',
          guidanceHtml:
            "<p>This one could do with a bit of pep. It's probably because it feels kind of passive. " +
            "We love it when you're assertive.</p>",
          displaySurface: 'was first seen',
          positionalInformation: {
            hashes: {
              issue: 'dg+ih1XodWeL7lJ/wo17QQ==',
              environment: ENVIRONMENT_HASH,
              index: 'fOJLASZHiwnwcJWcfbkXnw==1',
            },
            matches: [
              {
                extractedPart: 'Reports',
                extractedBegin: 1360,
                extractedEnd: 1367,
                originalPart: 'Reports',
                originalBegin: 33173,
                originalEnd: 33180,
              },
            ],
          },
          suggestions: [],
          issueLocations: [],
          readOnly: false,
          debug: {
            penalty: 40.0,
          },
        },
      ],
    },
  ],
  keywords: {
    links: {
      getTargetKeywords:
        'https://tenant.acrolinx.cloud/services/v1/rest/findability/targetKeywords?' +
        'contextId=C%3A%5CUsers%5Cgrabowski%5CDesktop%5Ccloud-linguistic-smoketest.docx',
      putTargetKeywords:
        'https://tenant.acrolinx.cloud/services/v1/rest/findability/targetKeywords?' +
        'contextId=C%3A%5CUsers%5Cgrabowski%5CDesktop%5Ccloud-linguistic-smoketest.docx',
    },
    discovered: [
      {
        keyword: 'Clarity card',
        sortKey: '10',
        density: 0.2546269436736127,
        count: 4,
        prominence: 0.0,
      },
    ],
    target: [],
  },
  reports: {
    scorecard: {
      linkAuthenticated: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.html',
      link: 'https://tenant.acrolinx.cloud/output/en/abcdef_1_report.html',
    },
  },
  addons: [],
};
