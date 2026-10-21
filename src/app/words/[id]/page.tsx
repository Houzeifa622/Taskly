import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import WordDetail from "@/components/WordDetail";

interface Props {
  params: { id: string };
}

export default async function WordPage({ params }: Props) {
  const wordId = Number(params.id);

  const word = await db.words.get(wordId);
  if (!word) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <WordDetail wordId={word.id!} />
    </div>
  );
}
