#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("lxgic-reddit-research")
    .description("Research any topic across Reddit, HN, and the web")
    .version("1.0.0")
    .argument("<topic>", "Topic to research")
    .option("-d, --days <n>", "How far back to search", "30")
    .option("-f, --format <type>", "Output format: text or json", "text")
    .option("-s, --sources", "Show source URLs", false)
    .action(async (topic, opts) => {
    const options = {
        days: parseInt(opts.days, 10) || 30,
        format: opts.format === "json" ? "json" : "text",
        sources: opts.sources || false,
    };
    const spinner = (0, ora_1.default)(`Researching "${topic}" across Reddit & HN...`).start();
    try {
        spinner.text = "Fetching discussions from Reddit and Hacker News...";
        const result = await (0, index_1.research)(topic, options);
        spinner.text = "Synthesizing findings with AI...";
        const output = (0, index_1.formatResult)(result, options);
        spinner.succeed("Research complete!\n");
        console.log(output);
    }
    catch (err) {
        spinner.fail(`Error: ${err.message}`);
        process.exit(1);
    }
});
program.parse();
