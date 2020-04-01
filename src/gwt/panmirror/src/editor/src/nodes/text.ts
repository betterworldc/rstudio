/*
 * text.ts
 *
 * Copyright (C) 2019-20 by RStudio, PBC
 *
 * Unless you have received this program directly from RStudio pursuant
 * to the terms of a commercial license agreement with RStudio, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */

import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from '../api/extension';
import { PandocOutput, PandocToken, PandocTokenType, tokenTextEscaped, PandocExtensions, PandocTokenReader } from '../api/pandoc';

const extension = (pandocExtensions: PandocExtensions) => {
  return {
    nodes: [
      {
        name: 'text',
        spec: {
          group: 'inline',
          toDOM(node: ProsemirrorNode): any {
            return node.text;
          },
        },
        pandoc: {
          readers: [
            { token: PandocTokenType.Str, text: true, 
              // raw_tex needs to take \ from pandoc and turn it into \\ within ProseMirror
              // this is so that users can write \\ to distinguish backslashes that shouldn't 
              // be taken as the start of a raw_tex block
              getText: pandocExtensions.raw_tex ? tokenTextEscaped : (t: PandocToken) => t.c 
            },
            { token: PandocTokenType.Space, text: true, getText: () => ' ' },
            { token: PandocTokenType.SoftBreak, text: true, getText: () => ' ' },
          ],
          writer: (output: PandocOutput, node: ProsemirrorNode) => {
            const text = node.textContent;
            output.writeText(text);
          },
        },
      },
    ],
  };
};

export default extension;

