import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import express from "express";

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Fout: ontbrekende environment variables!");
  process.exit(1);
}

const app = express();
app.get("/", (_, res) => res.send("Bot draait!"));
app.listen(3000, () => console.log("🌐 Keepalive actief."));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check of de bot werkt!"),
  new SlashCommandBuilder().setName("ban").setDescription("Verban een gebruiker")
    .addUserOption(o => o.setName("gebruiker").setDescription("Wie?").setRequired(true))
    .addStringOption(o => o.setName("reden").setDescription("Reden")),
  new SlashCommandBuilder().setName("kick").setDescription("Kick een gebruiker")
    .addUserOption(o => o.setName("gebruiker").setDescription("Wie?").setRequired(true))
    .addStringOption(o => o.setName("reden").setDescription("Reden"))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("🛠️ Slash commands registreren...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ Commands toegevoegd!");
  } catch (e) {
    console.error(e);
  }
})();

client.on("ready", () => console.log(`🤖 Ingelogd als ${client.user.tag}`));

client.on("interactionCreate", async i => {
  if (!i.isCommand()) return;
  if (i.commandName === "ping") return i.reply("🏓 Pong!");

  const user = i.options.getUser("gebruiker");
  const reason = i.options.getString("reden") || "Geen reden opgegeven";
  const member = user ? await i.guild.members.fetch(user.id).catch(() => null) : null;

  if (i.commandName === "ban") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return i.reply({ content: "Je mag niet bannen.", ephemeral: true });
    if (!member) return i.reply({ content: "Kan gebruiker niet vinden.", ephemeral: true });
    await member.ban({ reason });
    return i.reply(`🔨 ${user.tag} is verbannen. (${reason})`);
  }

  if (i.commandName === "kick") {
    if (!i.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return i.reply({ content: "Je mag niet kicken.", ephemeral: true });
    if (!member) return i.reply({ content: "Kan gebruiker niet vinden.", ephemeral: true });
    await member.kick(reason);
    return i.reply(`👢 ${user.tag} is gekickt. (${reason})`);
  }
});

client.login(TOKEN);
