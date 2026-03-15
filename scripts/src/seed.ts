import { db } from "@workspace/db";
import {
  channelsTable,
  videosTable,
  nichesTable,
  scheduleTable,
  dailyEarningsTable,
} from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  await db.delete(scheduleTable);
  await db.delete(videosTable);
  await db.delete(channelsTable);
  await db.delete(nichesTable);
  await db.delete(dailyEarningsTable);

  const [ch1] = await db.insert(channelsTable).values({
    name: "AI Money Mastery",
    niche: "Finance & Investing",
    subscribers: 142000,
    totalViews: 8200000,
    monthlyRevenue: 680000,
    videosPublished: 87,
    status: "active",
  }).returning();

  const [ch2] = await db.insert(channelsTable).values({
    name: "Tech Simplified Hindi",
    niche: "Technology Explainers",
    subscribers: 89000,
    totalViews: 4500000,
    monthlyRevenue: 420000,
    videosPublished: 63,
    status: "growing",
  }).returning();

  const [ch3] = await db.insert(channelsTable).values({
    name: "Motivational Shorts India",
    niche: "Motivation & Mindset",
    subscribers: 215000,
    totalViews: 12000000,
    monthlyRevenue: 390000,
    videosPublished: 142,
    status: "active",
  }).returning();

  const [ch4] = await db.insert(channelsTable).values({
    name: "Business Blueprint",
    niche: "Business Case Studies",
    subscribers: 31000,
    totalViews: 1100000,
    monthlyRevenue: 95000,
    videosPublished: 28,
    status: "growing",
  }).returning();

  const now = new Date();
  const day = 86400000;

  const videos = await db.insert(videosTable).values([
    {
      channelId: ch1.id,
      title: "How to Make ₹1 Lakh/Month with Index Funds in 2026",
      topic: "Index Fund Investing",
      status: "published",
      aiTool: "ChatGPT + ElevenLabs + Pictory",
      views: 320000,
      revenue: 18500,
      publishedAt: new Date(now.getTime() - 3 * day),
    },
    {
      channelId: ch1.id,
      title: "5 Stocks Every Indian Should Own in 2026",
      topic: "Stock Picks India",
      status: "published",
      aiTool: "Claude + Murf.ai + InVideo",
      views: 210000,
      revenue: 12200,
      publishedAt: new Date(now.getTime() - 7 * day),
    },
    {
      channelId: ch1.id,
      title: "The SIP Strategy That Made This Man a Crorepati",
      topic: "SIP Investing Success",
      status: "scheduled",
      aiTool: "ChatGPT + ElevenLabs + Lumen5",
      scheduledAt: new Date(now.getTime() + 1 * day),
    },
    {
      channelId: ch1.id,
      title: "Why 95% of Traders Lose Money (And How to Win)",
      topic: "Trading Psychology",
      status: "editing",
      aiTool: "Claude + Murf.ai + Pictory",
    },
    {
      channelId: ch1.id,
      title: "Real Estate vs Stocks: Where to Invest ₹10 Lakh?",
      topic: "Investment Comparison",
      status: "voiceover",
      aiTool: "ChatGPT + ElevenLabs",
    },
    {
      channelId: ch2.id,
      title: "How AI is Replacing 10 Crore Jobs in India by 2030",
      topic: "AI Jobs Impact India",
      status: "published",
      aiTool: "ChatGPT + ElevenLabs + Pictory",
      views: 180000,
      revenue: 9400,
      publishedAt: new Date(now.getTime() - 5 * day),
    },
    {
      channelId: ch2.id,
      title: "5G vs Starlink: Which Wins in India?",
      topic: "Internet Technology India",
      status: "scheduled",
      aiTool: "Claude + Murf.ai + InVideo",
      scheduledAt: new Date(now.getTime() + 2 * day),
    },
    {
      channelId: ch2.id,
      title: "ChatGPT Secrets Indians Don't Know About",
      topic: "ChatGPT Tips Hindi",
      status: "scripting",
      aiTool: "ChatGPT",
    },
    {
      channelId: ch3.id,
      title: "Elon Musk की Success Story: सपने बड़े रखो",
      topic: "Elon Musk Motivation",
      status: "published",
      aiTool: "ChatGPT + ElevenLabs + Lumen5",
      views: 540000,
      revenue: 15200,
      publishedAt: new Date(now.getTime() - 2 * day),
    },
    {
      channelId: ch3.id,
      title: "हर सुबह 5 बजे उठने का जादू",
      topic: "5AM Morning Routine",
      status: "scheduled",
      aiTool: "Claude + Murf.ai + Pictory",
      scheduledAt: new Date(now.getTime() + 0.5 * day),
    },
    {
      channelId: ch4.id,
      title: "Zepto की कहानी: कैसे बना ₹7000 Crore का Business",
      topic: "Zepto Startup Story",
      status: "published",
      aiTool: "ChatGPT + ElevenLabs + Pictory",
      views: 95000,
      revenue: 5800,
      publishedAt: new Date(now.getTime() - 4 * day),
    },
    {
      channelId: ch4.id,
      title: "Zomato vs Swiggy: Business Model Decoded",
      topic: "Food Delivery Business",
      status: "idea",
      aiTool: "ChatGPT",
    },
  ]).returning();

  await db.insert(scheduleTable).values([
    {
      videoId: videos[2].id,
      channelId: ch1.id,
      videoTitle: "The SIP Strategy That Made This Man a Crorepati",
      channelName: ch1.name,
      scheduledAt: new Date(now.getTime() + 1 * day),
      status: "scheduled",
    },
    {
      videoId: videos[6].id,
      channelId: ch2.id,
      videoTitle: "5G vs Starlink: Which Wins in India?",
      channelName: ch2.name,
      scheduledAt: new Date(now.getTime() + 2 * day),
      status: "scheduled",
    },
    {
      videoId: videos[9].id,
      channelId: ch3.id,
      videoTitle: "हर सुबह 5 बजे उठने का जादू",
      channelName: ch3.name,
      scheduledAt: new Date(now.getTime() + 0.5 * day),
      status: "scheduled",
    },
  ]);

  await db.insert(nichesTable).values([
    {
      name: "Finance & Investing",
      category: "Finance",
      competition: "medium",
      earning_potential: "very_high",
      cpm: 320,
      description: "Stock market tips, mutual funds, SIP strategies, personal finance for Indians. Evergreen content with very high CPM due to finance advertisers.",
      aiTools: ["ChatGPT", "ElevenLabs", "Pictory", "Canva AI"],
      exampleChannels: ["Pranjal Kamra", "CA Rachana Phadke Ranade", "Labour Law Advisor"],
    },
    {
      name: "Technology Explainers",
      category: "Technology",
      competition: "medium",
      earning_potential: "high",
      cpm: 220,
      description: "Breaking down complex tech topics in Hindi/English. AI, smartphones, gadgets, internet trends. Massive Indian audience hungry for tech content.",
      aiTools: ["Claude", "Murf.ai", "InVideo", "Midjourney"],
      exampleChannels: ["Technical Guruji", "Geeky Ranjit", "Gaurav Chaudhary"],
    },
    {
      name: "Motivation & Mindset",
      category: "Self-Improvement",
      competition: "high",
      earning_potential: "medium",
      cpm: 95,
      description: "Motivational speeches, success stories, mindset shifts in Hindi. Very high view counts but lower CPM. Compensated by massive volume.",
      aiTools: ["ChatGPT", "ElevenLabs", "Lumen5", "Canva AI"],
      exampleChannels: ["Sandeep Maheshwari", "Ujjwal Patni"],
    },
    {
      name: "Business Case Studies",
      category: "Business",
      competition: "low",
      earning_potential: "very_high",
      cpm: 285,
      description: "How Indian startups & businesses grew. Zepto, Mamaearth, Nykaa, etc. High demand, very low competition for faceless AI channels. Huge CPM from business advertisers.",
      aiTools: ["ChatGPT", "ElevenLabs", "Pictory", "Canva AI"],
      exampleChannels: ["Think School", "Wint Wealth"],
    },
    {
      name: "AI & Automation Tools",
      category: "Technology",
      competition: "low",
      earning_potential: "very_high",
      cpm: 350,
      description: "Tutorials on using AI tools — ChatGPT, Midjourney, n8n, Make.com. Extremely high CPM due to software advertisers. Growing 10x year-over-year.",
      aiTools: ["ChatGPT", "Murf.ai", "Lumen5", "Canva AI"],
      exampleChannels: ["Matt Wolfe", "AI Advantage"],
    },
    {
      name: "Health & Ayurveda",
      category: "Health",
      competition: "low",
      earning_potential: "high",
      cpm: 190,
      description: "Ancient Ayurvedic remedies, yoga, health tips in Hindi. Massive Indian audience. Low competition for AI faceless channels. Pharma advertisers pay well.",
      aiTools: ["Claude", "ElevenLabs", "InVideo", "Canva AI"],
      exampleChannels: ["Ayurvedic Nuskhe", "Dr. Vikram Chauhan"],
    },
    {
      name: "Real Estate India",
      category: "Finance",
      competition: "low",
      earning_potential: "very_high",
      cpm: 410,
      description: "Property investment guides, city-wise real estate analysis, home loan tips. Highest CPM niche in India. Real estate advertisers pay premium rates.",
      aiTools: ["ChatGPT", "ElevenLabs", "Pictory", "Midjourney"],
      exampleChannels: ["ANAROCK Property Consultants"],
    },
    {
      name: "Cricket & Sports Analysis",
      category: "Sports",
      competition: "medium",
      earning_potential: "medium",
      cpm: 115,
      description: "Match analysis, player comparisons, IPL predictions. Enormous Indian audience especially during cricket season. Easy AI-generated content from stats.",
      aiTools: ["ChatGPT", "Murf.ai", "Lumen5", "Canva AI"],
      exampleChannels: ["CricketNext", "Sports Tak"],
    },
  ]);

  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * day);
    const dateStr = d.toISOString().slice(0, 10);
    const base = 25000 + Math.random() * 30000;
    const amount = Math.round(base);
    const views = Math.round(400000 + Math.random() * 600000);
    const vids = Math.floor(3 + Math.random() * 5);
    dailyData.push({ date: dateStr, amount, views, videos: vids });
  }
  await db.insert(dailyEarningsTable).values(dailyData);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
