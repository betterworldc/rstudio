/*
 * insert_symbol.tsx
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

import { Schema } from 'prosemirror-model';
import { PluginKey, Transaction, EditorState } from 'prosemirror-state';

import { ProsemirrorCommand, EditorCommandId } from '../../api/command';
import { EditorEvents } from '../../api/events';
import { Extension } from '../../api/extension';
import { EditorFormat } from '../../api/format';
import { EditorOptions } from '../../api/options';
import { PandocExtensions } from '../../api/pandoc';
import { PandocCapabilities } from '../../api/pandoc_capabilities';
import { EditorUI } from '../../api/ui';
import { parseCodepoint } from '../../api/unicode';
import { OmniInsertGroup } from '../../api/omni_insert';

import { performInsertSymbol, InsertSymbolPlugin } from './insert_symbol-plugin';
import { SymbolDataProvider, SymbolCharacterGroup, SymbolCharacter } from './insert_symbol-dataprovider';

import untypedSymbolData from './symbols.json';

const key = new PluginKey<boolean>('insert-symbol');

const extension = (
  _pandocExtensions: PandocExtensions,
  _pandocCapabilities: PandocCapabilities,
  ui: EditorUI,
  _format: EditorFormat,
  _options: EditorOptions,
  events: EditorEvents,
): Extension => {
  return {
    commands: () => {
      return [new ProsemirrorCommand(EditorCommandId.Symbol, [], performInsertSymbol(key), symbolOmniInsert(ui))];
    },
    plugins: (_schema: Schema) => {
      return [new InsertSymbolPlugin(key, new UnicodeSymbolDataProvider(), ui, events)];
    },
  };
};

function symbolOmniInsert(ui: EditorUI) {
  return {
    name: ui.context.translateText('Symbol...'),
    description: ui.context.translateText("Unicode graphical symbol"),
    group: OmniInsertGroup.Content,
    priority: 6,
    image: () => ui.prefs.darkMode() 
      ? ui.images.omni_insert?.symbol_dark! 
      : ui.images.omni_insert?.symbol!,
  };
}


class UnicodeSymbolDataProvider implements SymbolDataProvider {
  constructor() {
    this.symbolGroups = (untypedSymbolData as SymbolCharacterGroup[]).sort((a, b) => a.name.localeCompare(b.name));
  }
  private readonly symbolGroups: SymbolCharacterGroup[];

  public insertSymbolTransaction(symbolCharacter: SymbolCharacter, searchTerm: string, state: EditorState) : Transaction {
    const tr = state.tr;
    tr.insertText(symbolCharacter.value);
    return tr;
  }

  public readonly filterPlaceholderHint = 'keyword or codepoint';

  public readonly symbolPreviewStyle: React.CSSProperties = { fontSize: "28px" } as React.CSSProperties;

  public symbolGroupNames(): string[] {
    return [kCategoryAll, ...this.symbolGroups.map(symbolGroup => symbolGroup.name)];
  }

  public getSymbols(groupName: string | undefined) {
    if (groupName === undefined || groupName === kCategoryAll) {
      return this.symbolGroups
        .map(symbolGroup => symbolGroup.symbols)
        .flat()
        .sort((a, b) => a.codepoint! - b.codepoint!);
    }
    return this.symbolGroups
      .filter(symbolGroup => groupName === symbolGroup.name)
      .map(symbolGroup => symbolGroup.symbols)
      .flat();
  }

  public filterSymbols(filterText: string, symbols: SymbolCharacter[]): SymbolCharacter[] {
    const codepoint = parseCodepoint(filterText);
    const filteredSymbols = symbols.filter(symbol => {
      // Search by name
      if (symbol.name.includes(filterText.toUpperCase())) {
        return true;
      }

      // Search by codepoint
      if (codepoint && symbol.codepoint === codepoint) {
        return true;
      }

      return false;
    });

    if (filteredSymbols.length === 0 && codepoint !== undefined) {
      return [
        {
          name: codepoint.toString(16),
          value: String.fromCodePoint(codepoint),
          codepoint,
        },
      ];
    }
    return filteredSymbols;
  }
}
const kCategoryAll = 'All';

export default extension;
