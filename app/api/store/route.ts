import { NextResponse } from "next/server";
import { mockStorage } from "@/lib/storage/mock-storage";

export async function GET() {
  return NextResponse.json({
    storefront: mockStorage.getStorefrontConfig(),
    products: mockStorage.listProducts(),
    rewards: mockStorage.listRewards(),
    assets: mockStorage.listAssets(),
    blogPosts: mockStorage.listBlogPosts(),
    hosting: mockStorage.getHostingConfig()
  });
}
