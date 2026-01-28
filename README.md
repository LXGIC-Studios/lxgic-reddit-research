# lxgic-reddit-research

Research any topic across Reddit, Hacker News, and the web from the last 30 days. Get synthesized trends, community sentiment, and actionable insights.

## Usage

```bash
npx lxgic-reddit-research "AI developer tools"
npx lxgic-reddit-research "React Server Components" --days 7
npx lxgic-reddit-research "Cursor IDE tips" --format json
npx lxgic-reddit-research "LLM fine-tuning" --sources
```

## Options

- `--days <n>` - How far back to search (default: 30)
- `--format <text|json>` - Output format (default: text)
- `--sources` - Show source URLs

## Requirements

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

## What You Get

- **Key Trends & Patterns** - What's actually happening with this topic
- **Community Sentiment** - What Reddit and HN are saying
- **Actionable Insights** - Specific things you can do with this info
- **Top Sources** - Links to the best discussions

## License

MIT
