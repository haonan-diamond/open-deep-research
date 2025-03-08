import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';
import { customModel } from '@/lib/ai';
import { generateText } from 'ai';
import { getCompanyInfoByWebsite, saveCompanyInfo } from '@/lib/db/queries';

// Schema for validating the request
const companyInfoSchema = z.object({
  website: z.string().url('Invalid website URL'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const validatedData = companyInfoSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { website } = validatedData.data;
    
    // Check if we already have cached information for this website
    const cachedInfo = await getCompanyInfoByWebsite(website);
    
    if (cachedInfo) {
      console.log('Using cached company information for:', website);
      return NextResponse.json(cachedInfo);
    }
    
    // If no cached data, use GPT to generate company information
    console.log('Generating new company information for:', website);
    const prompt = `
    I need information about a company based on their website URL: ${website}
    
    Please analyze this website and provide the following information:
    1. Company name (if you can determine it)
    2. A brief description of what the company does (2-3 sentences)
    3. The industry or sector the company operates in
    4. Key products or services they offer
    5. Any notable features or unique selling points
    
    If you cannot access the website directly, please make educated guesses based on the URL structure, domain name, and any other information you can infer. Format your response as JSON with the following structure:
    
    {
      "name": "Company Name",
      "description": "Brief description of the company",
      "industry": "Industry/sector",
      "products": "Key products/services",
      "uniqueFeatures": "Notable features or USPs"
    }
    `;
    
    const { text: result } = await generateText({
      model: customModel('gpt-4o', true),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });
    
    // Try to parse the result as JSON
    try {
      // Find JSON in the response (in case the model added extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : result;
      const companyInfo = JSON.parse(jsonString);
      
      // Save the generated information to the database
      await saveCompanyInfo({
        website,
        name: companyInfo.name,
        description: companyInfo.description,
        industry: companyInfo.industry,
        products: companyInfo.products,
        uniqueFeatures: companyInfo.uniqueFeatures,
      });
      
      return NextResponse.json(companyInfo);
    } catch (error) {
      console.error('Error parsing JSON from AI response:', error);
      // Return the raw text if JSON parsing fails
      return NextResponse.json({ 
        error: 'Failed to parse company information',
        rawResponse: result 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching company information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company information' },
      { status: 500 }
    );
  }
} 