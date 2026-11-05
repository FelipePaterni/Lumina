import console from "node:console";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ||
    "postgresql://lumina:local-development-only@localhost:5433/lumina",
});

const works = [
  {
    title: "O Jardim das Marés",
    slug: "o-jardim-das-mares",
    author: "Lia Campos",
    publisher: "Editora Horizonte",
    synopsis: "Uma narrativa sintética sobre memória, marés e recomeços.",
    language: "pt-BR",
    releaseDate: "2026-03-15",
    categories: ["Ficção", "Contemporâneo"],
    editions: [
      { format: "PHYSICAL", priceCents: 4290 },
      { format: "DIGITAL", priceCents: 2190 },
    ],
  },
  {
    title: "Cartografia do Amanhã",
    slug: "cartografia-do-amanha",
    author: "Ravi Nogueira",
    publisher: "Editora Horizonte",
    synopsis: "Ensaios sintéticos sobre cidades, tecnologia e futuros possíveis.",
    language: "pt-BR",
    releaseDate: "2025-11-20",
    categories: ["Não ficção", "Tecnologia"],
    editions: [
      { format: "PHYSICAL", priceCents: 5890 },
      { format: "DIGITAL", priceCents: 2990 },
    ],
  },
  {
    title: "The Quiet Observatory",
    slug: "the-quiet-observatory",
    author: "Morgan Vale",
    publisher: "North Star Press",
    synopsis: "A synthetic short novel about science, silence and discovery.",
    language: "en-US",
    releaseDate: "2027-01-10",
    categories: ["Ficção", "Ciência"],
    editions: [{ format: "DIGITAL", priceCents: 1590 }],
  },
];

for (const input of works) {
  const author = await prisma.author.upsert({
    where: { name: input.author },
    update: {},
    create: { name: input.author },
  });
  const publisher = await prisma.publisher.upsert({
    where: { name: input.publisher },
    update: {},
    create: { name: input.publisher },
  });
  const categories = await Promise.all(
    input.categories.map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  const work = await prisma.work.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      synopsis: input.synopsis,
      language: input.language,
      releaseDate: new Date(input.releaseDate),
      isVisible: true,
      authorId: author.id,
      publisherId: publisher.id,
    },
    create: {
      title: input.title,
      slug: input.slug,
      synopsis: input.synopsis,
      language: input.language,
      releaseDate: new Date(input.releaseDate),
      isVisible: true,
      authorId: author.id,
      publisherId: publisher.id,
    },
  });
  await prisma.workCategory.deleteMany({ where: { workId: work.id } });
  await prisma.workCategory.createMany({
    data: categories.map((category) => ({ workId: work.id, categoryId: category.id })),
  });
  await prisma.edition.deleteMany({ where: { workId: work.id } });
  await prisma.edition.createMany({
    data: input.editions.map((edition) => ({
      workId: work.id,
      format: edition.format,
      priceCents: edition.priceCents,
      isVisible: true,
    })),
  });
  console.log(`Seeded synthetic work: ${work.slug}`);
}

await prisma.$disconnect();
