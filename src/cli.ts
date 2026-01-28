#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";
import { research, formatResult, ResearchOptions } from "./index";

const program = new Command();

program
  .name("lxgic-reddit-research")
  .description("Research any topic across Reddit, HN, and the web")
  .version("1.0.0")
  .argument("<topic>", "Topic to research")
  .option("-d, --days <n>", "How far back to search", "30")
  .option("-f, --format <type>", "Output format: text or json", "text")
  .option("-s, --sources", "Show source URLs", false)
  .action(async (topic: string, opts: any) => {
    const options: ResearchOptions = {
      days: parseInt(opts.days, 10) || 30,
      format: opts.format === "json" ? "json" : "text",
      sources: opts.sources || false,
    };

    const spinner = ora(`Researching "${topic}" across Reddit & HN...`).start();
    try {
      spinner.text = "Fetching discussions from Reddit and Hacker News...";
      const result = await research(topic, options);
      spinner.text = "Synthesizing findings with AI...";
      const output = formatResult(result, options);
      spinner.succeed("Research complete!\n");
      console.log(output);
    } catch (err: any) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
