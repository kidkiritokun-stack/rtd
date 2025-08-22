const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { writeData, initializeData } = require('../utils/dataStore');

const initializeDefaultData = async () => {
  try {
    console.log('🚀 Initializing default data...');

    // Initialize data store
    await initializeData();

    // Create default authors
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const authorPasswordHash = await bcrypt.hash('author123', 12);

    const authors = [
      {
        id: uuidv4(),
        username: 'admin',
        passwordHash: adminPasswordHash,
        fullName: 'Site Administrator',
        designation: 'Chief Technology Officer',
        bio: 'Lead administrator and content manager for Right To Digital.',
        avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        role: 'admin',
        social: {
          instagram: 'https://instagram.com/righttodigi',
          youtube: null,
          x: 'https://x.com/righttodigi',
          facebook: null,
          linkedin: 'https://linkedin.com/company/righttodigi',
          website: 'https://righttodigi.com',
          email: 'admin@righttodigi.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: true
      },
      {
        id: uuidv4(),
        username: 'sarah_johnson',
        passwordHash: authorPasswordHash,
        fullName: 'Sarah Johnson',
        designation: 'Senior Growth Marketing Strategist',
        bio: 'Senior Growth Marketing Strategist with 8+ years of experience in D2C growth and conversion optimization.',
        avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        role: 'author',
        social: {
          instagram: null,
          youtube: null,
          x: 'https://x.com/sarahjohnson',
          facebook: null,
          linkedin: 'https://linkedin.com/in/sarahjohnson',
          website: null,
          email: 'sarah@righttodigi.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: true
      },
      {
        id: uuidv4(),
        username: 'mike_chen',
        passwordHash: authorPasswordHash,
        fullName: 'Mike Chen',
        designation: 'Data Analytics Specialist',
        bio: 'Data-driven marketing analyst specializing in first-party data strategies and customer lifecycle optimization.',
        avatarUrl: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        role: 'author',
        social: {
          instagram: null,
          youtube: 'https://youtube.com/@mikechen',
          x: null,
          facebook: null,
          linkedin: 'https://linkedin.com/in/mikechen',
          website: 'https://mikechen.dev',
          email: 'mike@righttodigi.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: true
      }
    ];

    // Create sample posts
    const posts = [
      {
        id: uuidv4(),
        title: 'How We Increased ROAS by 340% Using First-Party Data',
        slug: 'increased-roas-340-percent-first-party-data',
        excerpt: 'Discover the exact strategy we used to transform a struggling D2C brand into a profitable powerhouse using advanced first-party data techniques.',
        banner: {
          url: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Data analytics dashboard showing growth metrics and ROAS improvement'
        },
        contentType: 'Case Studies',
        serviceCategory: 'First Party Data',
        status: 'approved',
        authorId: authors[1].id,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        views: 1247,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>When <strong>EcoLiving Co.</strong> approached us, their ROAS was stuck at 1.8x despite spending $50K monthly on Meta and Google Ads. Their customer acquisition costs were climbing, and they were struggling to scale profitably.</p>

<h2>The Challenge</h2>
<p>EcoLiving Co. faced three critical issues:</p>
<ul>
<li>High customer acquisition costs (CAC) of $85 per customer</li>
<li>Low customer lifetime value (LTV) of $120</li>
<li>Poor audience targeting leading to low-quality traffic</li>
</ul>

<blockquote>
<p>"We were burning through our marketing budget with minimal returns. We needed a complete strategy overhaul." - Jessica Martinez, Founder of EcoLiving Co.</p>
</blockquote>

<h2>Our First-Party Data Strategy</h2>
<p>We implemented a comprehensive first-party data collection and activation system:</p>

<h3>1. Data Collection Infrastructure</h3>
<p>We set up advanced tracking to capture behavioral data across all touchpoints:</p>
<ul>
<li>Enhanced e-commerce tracking with custom events</li>
<li>Progressive profiling through interactive quizzes</li>
<li>Email engagement scoring and segmentation</li>
<li>Social media interaction tracking</li>
</ul>

<h3>2. Customer Segmentation</h3>
<p>Using the collected data, we created 12 distinct customer segments based on:</p>
<ul>
<li>Purchase behavior and frequency</li>
<li>Product preferences and categories</li>
<li>Engagement levels and touchpoints</li>
<li>Demographic and psychographic data</li>
</ul>

<h3>3. Lookalike Audience Creation</h3>
<p>We built high-value lookalike audiences using our top 5% customers, resulting in:</p>
<ul>
<li>47% lower CAC compared to broad targeting</li>
<li>23% higher conversion rates</li>
<li>31% increase in average order value</li>
</ul>

<h2>Implementation Timeline</h2>
<p>The transformation didn't happen overnight. Here's how we rolled out the strategy:</p>

<p><strong>Week 1-2:</strong> Data infrastructure setup and tracking implementation</p>
<p><strong>Week 3-4:</strong> Customer segmentation and analysis</p>
<p><strong>Week 5-8:</strong> Campaign optimization and audience testing</p>
<p><strong>Week 9-12:</strong> Scale and refinement phase</p>

<h2>Results That Speak Volumes</h2>
<p>After 3 months of implementation, the results were remarkable:</p>
<ul>
<li><strong>340% increase in ROAS</strong> (from 1.8x to 6.1x)</li>
<li><strong>52% reduction in CAC</strong> (from $85 to $41)</li>
<li><strong>89% increase in LTV</strong> (from $120 to $227)</li>
<li><strong>156% growth in monthly revenue</strong></li>
</ul>

<h2>Key Takeaways</h2>
<p>This case study demonstrates the power of first-party data when implemented strategically:</p>
<ol>
<li><strong>Quality over quantity:</strong> Better data leads to better targeting</li>
<li><strong>Segmentation is crucial:</strong> One-size-fits-all doesn't work</li>
<li><strong>Patience pays off:</strong> Allow time for data collection and optimization</li>
<li><strong>Continuous optimization:</strong> Regular analysis and refinement are essential</li>
</ol>

<p>Ready to transform your D2C growth strategy? Let's discuss how first-party data can revolutionize your business.</p>`,
            pullQuotes: [
              {
                text: "We were burning through our marketing budget with minimal returns. We needed a complete strategy overhaul.",
                citation: "Jessica Martinez, Founder of EcoLiving Co."
              }
            ]
          }
        },
        tags: ['first-party-data', 'roas', 'case-study', 'meta-ads', 'google-ads'],
        relatedIds: [],
        seo: {
          title: 'How We Increased ROAS by 340% Using First-Party Data | Case Study',
          description: 'Discover the exact strategy we used to transform a struggling D2C brand into a profitable powerhouse using advanced first-party data techniques.',
          canonical: null
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Ultimate Guide to High-Converting Creative Testing',
        slug: 'ultimate-guide-high-converting-creative-testing',
        excerpt: 'Learn the systematic approach to creative testing that helped us achieve 67% higher CTR and 43% lower CPA across 50+ D2C campaigns.',
        banner: {
          url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Creative design mockups and testing variations for digital advertising'
        },
        contentType: 'Blog Posts',
        serviceCategory: 'High Performing Creatives',
        status: 'approved',
        authorId: authors[2].id,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        views: 892,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>Creative testing is the backbone of successful D2C advertising. Yet, most brands approach it haphazardly, wasting budget on ineffective variations. After analyzing over 10,000 creative tests across 50+ campaigns, we've developed a systematic approach that consistently delivers results.</p>

<h2>The Creative Testing Framework</h2>
<p>Our framework consists of four key pillars:</p>

<h3>1. Strategic Hypothesis Development</h3>
<p>Before creating any variation, we develop clear hypotheses based on:</p>
<ul>
<li>Customer research and pain points</li>
<li>Competitor analysis and market gaps</li>
<li>Performance data from existing creatives</li>
<li>Platform-specific best practices</li>
</ul>

<h3>2. Systematic Variation Creation</h3>
<p>We test one variable at a time to isolate performance drivers:</p>
<ul>
<li><strong>Hook variations:</strong> Different opening statements or questions</li>
<li><strong>Visual styles:</strong> Photography vs. graphics vs. video</li>
<li><strong>Copy angles:</strong> Problem-focused vs. solution-focused vs. benefit-driven</li>
<li><strong>Call-to-action:</strong> Different CTAs and urgency levels</li>
</ul>

<h3>3. Proper Test Structure</h3>
<p>Each test follows strict parameters:</p>
<ul>
<li>Minimum 1,000 impressions per variation</li>
<li>7-day minimum test duration</li>
<li>Statistical significance threshold of 95%</li>
<li>Consistent audience and budget allocation</li>
</ul>

<h3>4. Data-Driven Decision Making</h3>
<p>We analyze multiple metrics to determine winners:</p>
<ul>
<li>Click-through rate (CTR)</li>
<li>Cost per acquisition (CPA)</li>
<li>Return on ad spend (ROAS)</li>
<li>Engagement rate and quality score</li>
</ul>

<h2>Creative Testing Best Practices</h2>

<h3>Start with Your Best Performers</h3>
<p>Don't reinvent the wheel. Use your top-performing creatives as a baseline and create variations that test specific elements.</p>

<h3>Test Across Multiple Platforms</h3>
<p>What works on Facebook might not work on TikTok. Platform-specific testing is crucial for optimal performance.</p>

<h3>Maintain a Testing Calendar</h3>
<p>Consistent testing prevents ad fatigue and ensures continuous optimization. We recommend testing 2-3 new variations weekly.</p>

<h2>Common Testing Mistakes to Avoid</h2>
<ol>
<li><strong>Testing too many variables at once:</strong> This makes it impossible to identify what's driving performance</li>
<li><strong>Ending tests too early:</strong> Statistical significance requires adequate sample size and time</li>
<li><strong>Ignoring audience fatigue:</strong> Even winning creatives need refreshing every 2-3 weeks</li>
<li><strong>Not documenting learnings:</strong> Keep a database of insights to inform future tests</li>
</ol>

<h2>Tools and Resources</h2>
<p>Essential tools for effective creative testing:</p>
<ul>
<li><strong>Facebook Creative Hub:</strong> For mockups and previews</li>
<li><strong>Canva or Figma:</strong> For quick variation creation</li>
<li><strong>Google Optimize:</strong> For landing page testing</li>
<li><strong>Analytics platforms:</strong> For comprehensive performance tracking</li>
</ul>

<h2>Measuring Success</h2>
<p>Success metrics vary by campaign objective, but key indicators include:</p>
<ul>
<li>Improved CTR (target: 2%+ for most industries)</li>
<li>Lower CPA (aim for 20-30% reduction)</li>
<li>Higher ROAS (minimum 3:1 for profitability)</li>
<li>Increased engagement and brand recall</li>
</ul>

<p>Creative testing isn't just about finding winners—it's about understanding your audience and continuously improving your messaging. Start implementing this framework today and watch your campaign performance soar.</p>`,
            pullQuotes: [
              {
                text: "Creative testing isn't just about finding winners—it's about understanding your audience and continuously improving your messaging.",
                citation: null
              }
            ]
          }
        },
        tags: ['creative-testing', 'advertising', 'ctr', 'cpa', 'optimization'],
        relatedIds: [],
        seo: {
          title: 'The Ultimate Guide to High-Converting Creative Testing | D2C Marketing',
          description: 'Learn the systematic approach to creative testing that helped us achieve 67% higher CTR and 43% lower CPA across 50+ D2C campaigns.',
          canonical: null
        },
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Customer Interview: How BrandX Scaled from $100K to $2M ARR',
        slug: 'customer-interview-brandx-scaled-100k-2m-arr',
        excerpt: 'An in-depth conversation with BrandX founder about their journey from startup to multi-million dollar D2C success story.',
        banner: {
          url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Professional interview setup with entrepreneur discussing business growth'
        },
        contentType: 'User Interview',
        serviceCategory: 'Other',
        status: 'approved',
        authorId: authors[1].id,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        views: 634,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>We sat down with <strong>Alex Rodriguez</strong>, founder of BrandX, to discuss their remarkable journey from a $100K startup to a $2M ARR D2C powerhouse. Here's what we learned about scaling, challenges, and the strategies that made the difference.</p>

<h2>The Beginning</h2>
<p><strong>RTD:</strong> Tell us about the early days of BrandX. What was your initial vision?</p>

<p><strong>Alex:</strong> We started BrandX in 2021 with a simple mission: create sustainable, high-quality products that people actually want to use daily. I was frustrated with the lack of eco-friendly options in our category, so I decided to build the solution myself.</p>

<p>The first year was tough. We launched with $50K in savings and a single product. Revenue was slow—we barely hit $100K in our first 12 months.</p>

<h2>The Turning Point</h2>
<p><strong>RTD:</strong> What changed between year one and your current success?</p>

<p><strong>Alex:</strong> Three things: product-market fit, the right marketing partner, and data-driven decision making.</p>

<blockquote>
<p>"We realized we were trying to be everything to everyone. Once we focused on our core customer—environmentally conscious millennials with disposable income—everything clicked."</p>
</blockquote>

<p>We also partnered with Right To Digital in early 2022. Their approach to first-party data and customer segmentation completely transformed our marketing efficiency.</p>

<h2>Scaling Challenges</h2>
<p><strong>RTD:</strong> What were the biggest obstacles during your growth phase?</p>

<p><strong>Alex:</strong> Cash flow was the biggest challenge. When you're growing 20% month-over-month, you need capital for inventory, marketing, and team expansion. We had to get creative with financing.</p>

<p>Another major challenge was maintaining quality while scaling production. We went through three manufacturers before finding the right partner who could maintain our standards at volume.</p>

<h2>Marketing Evolution</h2>
<p><strong>RTD:</strong> How did your marketing strategy evolve as you scaled?</p>

<p><strong>Alex:</strong> Initially, we relied heavily on organic social media and word-of-mouth. That got us to about $30K monthly revenue, but we hit a ceiling.</p>

<p>Working with RTD, we implemented:</p>
<ul>
<li>Sophisticated customer segmentation</li>
<li>Lookalike audiences based on our best customers</li>
<li>Retention marketing campaigns</li>
<li>Conversion rate optimization on our site</li>
</ul>

<p>Our ROAS improved from 2.1x to 5.8x within six months.</p>

<h2>Key Metrics and Milestones</h2>
<p><strong>RTD:</strong> Can you share some key numbers from your journey?</p>

<p><strong>Alex:</strong> Sure! Here's our progression:</p>
<ul>
<li><strong>Year 1 (2021):</strong> $100K revenue, -$20K profit</li>
<li><strong>Year 2 (2022):</strong> $650K revenue, $85K profit</li>
<li><strong>Year 3 (2023):</strong> $2M revenue, $420K profit</li>
</ul>

<p>Our customer acquisition cost dropped from $95 to $38, while lifetime value increased from $180 to $340.</p>

<h2>Team and Operations</h2>
<p><strong>RTD:</strong> How did you build your team during this growth?</p>

<p><strong>Alex:</strong> We started with just me and a part-time assistant. Now we're a team of 12:</p>
<ul>
<li>3 in product development</li>
<li>2 in operations and fulfillment</li>
<li>2 in customer service</li>
<li>3 in marketing (working closely with RTD)</li>
<li>2 in finance and admin</li>
</ul>

<p>The key was hiring slowly and focusing on cultural fit. Every hire had to be someone who believed in our mission.</p>

<h2>Advice for Other Founders</h2>
<p><strong>RTD:</strong> What advice would you give to other D2C founders trying to scale?</p>

<p><strong>Alex:</strong> Three things:</p>

<ol>
<li><strong>Focus on unit economics early:</strong> If you can't make money on one customer, you can't make money on a thousand.</li>
<li><strong>Invest in the right partnerships:</strong> Don't try to do everything in-house. Find experts who can accelerate your growth.</li>
<li><strong>Listen to your customers obsessively:</strong> They'll tell you exactly what you need to build and how to market it.</li>
</ol>

<blockquote>
<p>"The biggest mistake I see founders make is trying to scale before they have product-market fit. Get that right first, then worry about growth."</p>
</blockquote>

<h2>What's Next</h2>
<p><strong>RTD:</strong> Where do you see BrandX in the next 2-3 years?</p>

<p><strong>Alex:</strong> We're targeting $10M ARR by 2026. We're expanding our product line and exploring international markets. The foundation is solid—now it's about smart, sustainable growth.</p>

<p>We're also looking at potential acquisition opportunities to accelerate our expansion into adjacent categories.</p>

<h2>Final Thoughts</h2>
<p>Alex's journey with BrandX demonstrates that with the right strategy, partnerships, and execution, rapid D2C growth is achievable. The key is focusing on fundamentals: product-market fit, customer understanding, and data-driven marketing.</p>

<p>Want to learn more about scaling your D2C brand? Let's discuss how we can help you achieve similar results.</p>`,
            pullQuotes: [
              {
                text: "We realized we were trying to be everything to everyone. Once we focused on our core customer—environmentally conscious millennials with disposable income—everything clicked.",
                citation: "Alex Rodriguez, Founder of BrandX"
              },
              {
                text: "The biggest mistake I see founders make is trying to scale before they have product-market fit. Get that right first, then worry about growth.",
                citation: "Alex Rodriguez, Founder of BrandX"
              }
            ]
          }
        },
        tags: ['customer-interview', 'scaling', 'arr-growth', 'd2c-success', 'brandx'],
        relatedIds: [],
        seo: {
          title: 'Customer Interview: How BrandX Scaled from $100K to $2M ARR',
          description: 'An in-depth conversation with BrandX founder about their journey from startup to multi-million dollar D2C success story.',
          canonical: null
        },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Conversion Rate Optimization: 15 Proven Tactics That Work',
        slug: 'conversion-rate-optimization-15-proven-tactics',
        excerpt: 'Discover 15 battle-tested CRO tactics that have helped our clients increase conversion rates by an average of 127% across various industries.',
        banner: {
          url: 'https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Website conversion optimization dashboard showing improved metrics'
        },
        contentType: 'Blog Posts',
        serviceCategory: 'CRO',
        status: 'approved',
        authorId: authors[2].id,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        views: 1156,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>Conversion rate optimization (CRO) is the fastest way to increase revenue without spending more on traffic. After optimizing hundreds of D2C websites, we've identified 15 tactics that consistently deliver results. Here's your complete playbook.</p>

<h2>Foundation Tactics (Must-Haves)</h2>

<h3>1. Optimize Page Load Speed</h3>
<p>Every second of delay costs you conversions. Aim for:</p>
<ul>
<li>Under 3 seconds load time</li>
<li>Core Web Vitals in the green</li>
<li>Optimized images and compressed files</li>
</ul>
<p><strong>Impact:</strong> 1-second improvement = 7% conversion increase</p>

<h3>2. Mobile-First Design</h3>
<p>With 60%+ of traffic on mobile, your mobile experience must be flawless:</p>
<ul>
<li>Thumb-friendly navigation</li>
<li>Large, tappable buttons</li>
<li>Simplified checkout process</li>
</ul>

<h3>3. Clear Value Proposition</h3>
<p>Visitors should understand your value within 5 seconds:</p>
<ul>
<li>Headline that addresses main benefit</li>
<li>Supporting subheadline with details</li>
<li>Visual that reinforces the message</li>
</ul>

<h2>Trust and Credibility Tactics</h2>

<h3>4. Social Proof Integration</h3>
<p>Display social proof strategically:</p>
<ul>
<li>Customer reviews on product pages</li>
<li>Testimonials on landing pages</li>
<li>User-generated content in galleries</li>
<li>Trust badges and certifications</li>
</ul>

<h3>5. Transparent Pricing</h3>
<p>Hidden costs kill conversions:</p>
<ul>
<li>Show total price upfront</li>
<li>Display shipping costs early</li>
<li>Offer price matching if applicable</li>
</ul>

<h3>6. Security Indicators</h3>
<p>Make visitors feel safe:</p>
<ul>
<li>SSL certificates and security badges</li>
<li>Secure payment icons</li>
<li>Privacy policy links</li>
<li>Money-back guarantees</li>
</ul>

<h2>User Experience Tactics</h2>

<h3>7. Simplified Navigation</h3>
<p>Reduce cognitive load:</p>
<ul>
<li>Limit main menu to 7 items or fewer</li>
<li>Use descriptive labels</li>
<li>Implement breadcrumbs</li>
<li>Add search functionality</li>
</ul>

<h3>8. Optimized Forms</h3>
<p>Every field you remove increases conversions:</p>
<ul>
<li>Ask only for essential information</li>
<li>Use single-column layouts</li>
<li>Implement real-time validation</li>
<li>Show progress indicators</li>
</ul>

<h3>9. Strategic CTAs</h3>
<p>Your call-to-action buttons should:</p>
<ul>
<li>Use action-oriented language</li>
<li>Stand out visually</li>
<li>Create urgency when appropriate</li>
<li>Be placed above the fold</li>
</ul>

<h2>Psychological Tactics</h2>

<h3>10. Scarcity and Urgency</h3>
<p>Create motivation to act now:</p>
<ul>
<li>Limited-time offers</li>
<li>Stock counters</li>
<li>Countdown timers</li>
<li>Exclusive access messaging</li>
</ul>

<h3>11. Loss Aversion</h3>
<p>Frame benefits as avoiding losses:</p>
<ul>
<li>"Don't miss out on savings"</li>
<li>"Avoid the hassle of..."</li>
<li>"Stop wasting money on..."</li>
</ul>

<h3>12. Reciprocity Principle</h3>
<p>Give value before asking for something:</p>
<ul>
<li>Free shipping thresholds</li>
<li>Bonus items with purchase</li>
<li>Free resources and guides</li>
<li>Loyalty program benefits</li>
</ul>

<h2>Advanced Tactics</h2>

<h3>13. Exit-Intent Popups</h3>
<p>Capture leaving visitors:</p>
<ul>
<li>Discount offers</li>
<li>Email signup incentives</li>
<li>Free shipping offers</li>
<li>Content upgrades</li>
</ul>

<h3>14. Personalization</h3>
<p>Tailor experiences to user behavior:</p>
<ul>
<li>Returning visitor messaging</li>
<li>Location-based offers</li>
<li>Browsing history recommendations</li>
<li>Abandoned cart recovery</li>
</ul>

<h3>15. A/B Testing Everything</h3>
<p>Never assume—always test:</p>
<ul>
<li>Headlines and copy</li>
<li>Button colors and text</li>
<li>Page layouts</li>
<li>Pricing strategies</li>
</ul>

<h2>Implementation Priority</h2>
<p>Start with these high-impact, low-effort tactics:</p>
<ol>
<li>Page speed optimization</li>
<li>Mobile responsiveness</li>
<li>Clear value proposition</li>
<li>Trust signals</li>
<li>CTA optimization</li>
</ol>

<h2>Measuring Success</h2>
<p>Track these key metrics:</p>
<ul>
<li><strong>Conversion rate:</strong> Primary success metric</li>
<li><strong>Bounce rate:</strong> Engagement indicator</li>
<li><strong>Time on page:</strong> Content quality measure</li>
<li><strong>Cart abandonment rate:</strong> Checkout optimization need</li>
</ul>

<h2>Common CRO Mistakes</h2>
<p>Avoid these pitfalls:</p>
<ul>
<li>Testing too many elements at once</li>
<li>Ending tests too early</li>
<li>Ignoring statistical significance</li>
<li>Not segmenting results by traffic source</li>
<li>Focusing only on conversion rate (ignore revenue per visitor)</li>
</ul>

<blockquote>
<p>"CRO isn't about tricks or hacks—it's about understanding your customers and removing barriers to conversion."</p>
</blockquote>

<h2>Getting Started</h2>
<p>Ready to optimize your conversion rates? Start with a comprehensive audit of your current site, identify the biggest opportunities, and begin testing systematically.</p>

<p>Remember: small improvements compound. A 10% increase in conversion rate can double your profits if you're operating on thin margins.</p>

<p>Need help implementing these tactics? Our CRO experts can audit your site and create a custom optimization roadmap.</p>`,
            pullQuotes: [
              {
                text: "CRO isn't about tricks or hacks—it's about understanding your customers and removing barriers to conversion.",
                citation: null
              }
            ]
          }
        },
        tags: ['cro', 'conversion-optimization', 'website-optimization', 'ab-testing', 'ux'],
        relatedIds: [],
        seo: {
          title: 'Conversion Rate Optimization: 15 Proven Tactics That Work | CRO Guide',
          description: 'Discover 15 battle-tested CRO tactics that have helped our clients increase conversion rates by an average of 127% across various industries.',
          canonical: null
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Draft: Upcoming Retention Marketing Strategies',
        slug: 'draft-retention-marketing-strategies',
        excerpt: 'A comprehensive guide to retention marketing strategies that will be published soon.',
        banner: {
          url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Email marketing and customer retention dashboard'
        },
        contentType: 'Blog Posts',
        serviceCategory: 'Retention Marketing',
        status: 'draft',
        authorId: authors[1].id,
        publishedAt: null,
        views: 0,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>This is a draft post about retention marketing strategies. Content coming soon...</p>`,
            pullQuotes: []
          }
        },
        tags: ['retention-marketing', 'email-marketing', 'customer-loyalty'],
        relatedIds: [],
        seo: {
          title: 'Retention Marketing Strategies for D2C Brands',
          description: 'A comprehensive guide to retention marketing strategies that will be published soon.',
          canonical: null
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: uuidv4(),
        title: 'Pending: Meta Ads Strategy Deep Dive',
        slug: 'pending-meta-ads-strategy-deep-dive',
        excerpt: 'An in-depth analysis of Meta advertising strategies for D2C brands, currently under review.',
        banner: {
          url: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=2',
          alt: 'Facebook and Instagram advertising campaign dashboard'
        },
        contentType: 'Case Studies',
        serviceCategory: 'Meta & Google Ads',
        status: 'pending_approval',
        authorId: authors[2].id,
        publishedAt: null,
        views: 0,
        template: {
          mode: 'default',
          defaultFields: {
            body: `<p>This post is currently pending approval. It contains detailed strategies for Meta advertising...</p>`,
            pullQuotes: []
          }
        },
        tags: ['meta-ads', 'facebook-ads', 'instagram-ads', 'strategy'],
        relatedIds: [],
        seo: {
          title: 'Meta Ads Strategy Deep Dive for D2C Brands',
          description: 'An in-depth analysis of Meta advertising strategies for D2C brands, currently under review.',
          canonical: null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Create settings
    const settings = {
      site: {
        title: 'Right To Digital - Case Studies',
        description: 'Discover how we engineer growth for D2C brands through data-driven strategies and proven methodologies.',
        url: process.env.SITE_URL || 'http://localhost:3000',
        contactEmail: 'contact@righttodigi.com'
      },
      popularPosts: [
        posts[0].id, // First-party data case study
        posts[1].id, // Creative testing guide
        posts[3].id  // CRO tactics
      ],
      contentTypes: [
        'Blog Posts',
        'Case Studies', 
        'User Interview',
        'Quantitative Research',
        'Competitors Research'
      ],
      serviceCategories: [
        'Meta & Google Ads',
        'First Party Data',
        'CRO',
        'High Performing Creatives',
        'Retention Marketing',
        'Other'
      ],
      cta: {
        title: 'Ready To Accelerate Your D2C Growth?',
        subtitle: 'Book your free consultation and discover how we can transform your business.',
        buttonText: 'Book Your Free Consultation',
        buttonUrl: '/contact'
      }
    };

    // Write data to files
    await writeData('authors', authors);
    await writeData('posts', posts);
    await writeData('settings', settings);
    await writeData('inbox', []); // Empty inbox

    console.log('✅ Default data initialized successfully!');
    console.log('📊 Created:');
    console.log(`   - ${authors.length} authors`);
    console.log(`   - ${posts.length} posts (${posts.filter(p => p.status === 'approved').length} approved)`);
    console.log('🔐 Default login credentials:');
    console.log('   - Admin: admin / admin123');
    console.log('   - Author: sarah_johnson / author123');
    console.log('   - Author: mike_chen / author123');

  } catch (error) {
    console.error('❌ Failed to initialize data:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initializeDefaultData();
}

module.exports = { initializeDefaultData };