import {
  ActionRowBuilder,
  AttachmentBuilder,
  ModalBuilder,
  type ModalSubmitInteraction,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { svgToPng } from '../../modules/svgToPng';
import { texToSvg } from '../../modules/texToSvg';

import type { SlashCommand } from '../types';

const texCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('tex').setDescription('数式を画像にして出力します'),
  execute: async (interaction) => {
    const modal = new ModalBuilder().setCustomId('texModal').setTitle('TeX to Image');
    const texInput = new TextInputBuilder()
      .setCustomId('texInput')
      .setLabel('画像にしたい数式を書いてね')
      .setMaxLength(500)
      .setStyle(TextInputStyle.Paragraph);

    const texActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(texInput);

    modal.addComponents(texActionRow);
    await interaction.showModal(modal);
  },
};

export default texCommand;

// Modal submit handler for TeX rendering
export async function handleTexModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const tex = interaction.fields.getTextInputValue('texInput');
  await interaction.deferReply();

  if (!tex || !tex.trim()) {
    await interaction.editReply({ content: '無効な数式です。正しいTeX形式で入力してください。' });
    return;
  }

  const svg = await texToSvg(tex.trim());
  const png = svgToPng(svg); // 背景は透過、色はSVG側で #fbfbfb
  const file = new AttachmentBuilder(png, { name: 'formula.png' });
  await interaction.editReply({ files: [file] });
}
