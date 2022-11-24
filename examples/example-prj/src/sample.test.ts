import { defineUserFactory, definePostFactory } from "./__generated__/fabbrica";

const prisma = jestPrisma.client;

const UserFactory = defineUserFactory();

const PostFactory = definePostFactory({
  defaultData: {
    author: UserFactory,
  },
});

const PostFactoryAlt = definePostFactory({
  defaultData: async () => ({
    author: {
      connectOrCreate: {
        where: {
          id: "user001",
        },
        create: await UserFactory.buildCreateInput({
          id: "user001",
        }),
      },
    },
  }),
});

describe("factories", () => {
  describe("UserFactory", () => {
    it("creates records without input parameters", async () => {
      await UserFactory.create();
      await UserFactory.create();
      await expect(prisma.user.count()).resolves.toBe(2);
    });

    it("creates record with input parameters", async () => {
      await UserFactory.create({ id: "user001", name: "Quramy" });
      const user = await prisma.user.findUnique({ where: { id: "user001" } });
      expect(user).toEqual({ id: "user001", name: "Quramy" });
    });
  });

  describe("PostFactory", () => {
    it("creates required relation field without parameters", async () => {
      await PostFactory.create();
      const created = await prisma.post.findFirst({ include: { author: true } });
      expect(created?.id).not.toBeFalsy();
      expect(created?.author.id).not.toBeFalsy();
    });

    it("creates records using connection created by other factory", async () => {
      const user = await UserFactory.createForConnect({ name: "quramy" });
      await PostFactory.create({ author: { connect: user } });
      await PostFactory.create({ author: { connect: user } });
      await PostFactory.create({ author: { connect: user } });
      expect(prisma.user.count()).resolves.toBe(1);
      const userWithPosts = await prisma.user.findFirst({ where: { name: "quramy" }, include: { posts: true } });
      expect(userWithPosts?.posts.length).toBe(3);
    });
  });

  describe("PostFactoryAlt", () => {
    it("creates post record", async () => {
      await PostFactoryAlt.create();
      await expect(prisma.user.count()).resolves.toBe(1);
    });

    it("creates related user at most one", async () => {
      await PostFactoryAlt.create();
      await PostFactoryAlt.create();
      await PostFactoryAlt.create();
      await expect(prisma.user.count()).resolves.toBe(1);
    });
  });
});
