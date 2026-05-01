
async function test() {
  const prompt = "e commerce website";
  const AWS_SERVICES = {ec2:1, rds:1, s3:1, apigw:1, lambda:1, iam:1, cloudfront:1, vpc:1, dynamodb:1, elasticache:1, sqs:1, route53:1, alb:1, dms:1, glue:1, snowball:1, snowflake:1};
  const systemPrompt = `You are a strict JSON bot. You MUST respond with ONLY a raw JSON object. Do not explain your reasoning. Output ONLY valid JSON.\n{"nodes": ["cloudfront", "s3", "apigw", "lambda"], "edges": [["cloudfront", "s3"], ["apigw", "lambda"]]}\nNow generate the architecture for: "${prompt}". Use ONLY these components: ${Object.keys(AWS_SERVICES).join(', ')}.`;

  console.log("Fetching...");
  const response = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(systemPrompt)}?json=true`);
  const text = await response.text();
  console.log("RAW TEXT:\n", text);
  
  try {
     const match = text.match(/\{[\s\S]*"nodes"[\s\S]*?\}/);
     if (match) {
        console.log("Matched JSON:", match[0]);
        const data = JSON.parse(match[0]);
        console.log("Successfully parsed:", data);
     } else {
        console.log("No regex match found.");
     }
  } catch (e) {
     console.error("Parse error:", e);
  }
}

test();
