// app/api/v1/conversation/chat/message/fetchUrlMetadata
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(request: NextRequest) {
 
  const searchParams = new URL(request.url).searchParams;
  const url = searchParams.get('url');
  
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const fixUrlProtocol = (url:string) => {
    if (!/^https?:\/\//i.test(url)) {
      // If the URL doesn't start with 'http://' or 'https://', add 'http://'
      return `http://${url}`;
    }
    return url; // Return the original URL if it's already valid
  };
  
  // Fix the URL
  const fixedUrl = fixUrlProtocol(url);

  try {
    const response = await fetch(fixedUrl);
    const html = await response.text();

    // Parse the HTML to get metadata (this could be improved with a library like cheerio)
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)"/);

    const metadata = {
      title: titleMatch ? titleMatch[1] : 'No Title',
      image: ogImageMatch ? ogImageMatch[1] : null,
    };

    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch URL metadata' }, { status: 500 });
  }
}
