import { CfnOutput, Fn, Stack, StackProps, Tags } from "aws-cdk-lib";
import {
  AllowedMethods,
  CachedMethods,
  CachePolicy,
  Distribution,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Architecture, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class SetLambdaFunctionUrlsAtOriginOfCloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create a lambda function
    const lambdaFunction = new NodejsFunction(this, "LambdaFunction", {
      entry: "./src/index.ts",
      handler: "handler",
      architecture: Architecture.ARM_64,
    });

    // enable lambda function urls
    const lambdaUrl = lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // formatting to match cloudfront parameters
    const lambdaUrlWithoutProtocol = Fn.select(
      1,
      Fn.split("://", lambdaUrl.url)
    );

    const lambdaUrlDomainName = Fn.select(
      0,
      Fn.split("/", lambdaUrlWithoutProtocol)
    );

    // create cloudfront distribution
    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
        origin: new HttpOrigin(lambdaUrlDomainName),
      },
    });

    new CfnOutput(this, "DistributionDomainName", {
      value: distribution.domainName,
    });
  }
}
