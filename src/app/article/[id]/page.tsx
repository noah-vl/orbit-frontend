import { ArticleReader } from "@/components/features/article/ArticleReader";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ArticleReader articleId={id} />;
}
