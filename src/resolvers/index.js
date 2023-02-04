/*------------------------------- imports -------------------------------*/

const path = require("path");
const fsPromises = require("fs/promises");
const {
  fileExists,
  readJsonFile,
  deleteFile,
  getDirectoryFileNames,
} = require("../utils/fileHandling");
const { GraphQLError, printType } = require("graphql");
const crypto = require("crypto");
const axios = require("axios").default;

/*------------------------------- global file paths -------------------------------*/

const productsDirectory = path.join(__dirname, "..", "data", "products");
const shoppingCartsDirectory = path.join(
  __dirname,
  "..",
  "data",
  "shoppingCarts"
);

/*------------------------------- resolvers -------------------------------*/

exports.resolvers = {
  /*---------------------- queries -----------------------*/
  Query: {
    /*-------- product --------*/

    getProductById: async (_, args) => {
      const productId = args.productId;
      const productFilePath = path.join(productsDirectory, `${productId}.json`);

      const productExists = await fileExists(productFilePath);
      if (!productExists)
        return new GraphQLError("That product does not exist");

      const productData = await fsPromises.readFile(productFilePath, {
        encoding: "utf-8",
      });
      const data = JSON.parse(productData);
      return data;
    },

    getAllProducts: async (_, args) => {
      const allProducts = await getDirectoryFileNames(productsDirectory);

      const allProductsData = [];

      for (const file of allProducts) {
        const filePath = path.join(productsDirectory, file);
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        const data = JSON.parse(fileContents);
        allProductsData.push(data);
      }

      return allProductsData;
    },

    /*-------- shopping cart --------*/

    getShoppingCartById: async (_, args) => {
      const shoppingCartId = args.shoppingCartId;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, that shoppingcart does not exist! Try again :)"
        );

      const shoppingCartData = await fsPromises.readFile(shoppingCartFilePath, {
        encoding: "utf-8",
      });
      const data = JSON.parse(shoppingCartData);

      return data;
    },

    getAllShoppingCarts: async (_) => {
      const allShoppingCarts = await getDirectoryFileNames(
        shoppingCartsDirectory
      );

      const allShoppingCartsData = [];

      for (const file of allShoppingCarts) {
        const filePath = path.join(shoppingCartsDirectory, file);
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        const data = JSON.parse(fileContents);

        allShoppingCartsData.push(data);
      }

      return allShoppingCartsData;
    },
  },

  /*---------------------- mutations -----------------------*/

  Mutation: {
    /*-------- shopping cart --------*/

    createNewShoppingCart: async (_, args) => {
      const newShoppingCart = {
        id: crypto.randomUUID(),
        itemsInCart: [],
        totalSum: 0,
      };

      let filePath = path.join(
        shoppingCartsDirectory,
        `${newShoppingCart.id}.json`
      );

      let idExists = true;
      while (idExists) {
        const exists = await fileExists(filePath);
        console.log(exists, newShoppingCart.id);
        if (exists) {
          newShoppingCart.id = crypto.randomUUID();
          filePath = path.join(productsDirectory, `${newShoppingCart.id}.json`);
        }
        idExists = exists;
      }

      await fsPromises.writeFile(filePath, JSON.stringify(newShoppingCart));

      return newShoppingCart;
    },

    deleteShoppingCart: async (_, args) => {
      const shoppingCartId = args.shoppingCartId;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );

      try {
        await deleteFile(shoppingCartFilePath);
      } catch (error) {
        return {
          deletedId: shoppingCartId,
          success: false,
        };
      }

      return {
        deletedId: shoppingCartId,
        success: true,
      };
    },

    /*-------- + / - cartItems --------*/

    addCartItem: async (_, args) => {
      const { shoppingCartId, productId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );
      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);

      let itemInCartExists = false;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        if (cartItem.id === productId) {
          cartItem.quantity++;
          itemInCartExists = true;
        }
      }

      if (!itemInCartExists) {
        const productFilePath = path.join(
          productsDirectory,
          `${productId}.json`
        );

        const productExists = await fileExists(productFilePath);
        if (!productExists)
          return new GraphQLError(
            "Sorry, that product doesn't exist in our directory."
          );

        const productToAdd = await readJsonFile(productFilePath);

        const newCartItem = {
          id: productToAdd.id,
          name: productToAdd.name,
          unitPrice: productToAdd.unitPrice,
          quantity: 1,
        };

        shoppingCartToUpdate.itemsInCart.push(newCartItem);
      }

      let newSum = 0;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        newSum += cartItem.quantity * cartItem.unitPrice;
      }
      shoppingCartToUpdate.totalSum = newSum;

      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },

    removeCartItem: async (_, args) => {
      const { shoppingCartId, cartItemId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );
      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);

      let itemInCartExist = false;
      for (let i = 0; i > shoppingCartToUpdate.itemsInCart.length; i++) {
        if (shoppingCartToUpdate.itemsInCart[i].id === cartItemId) {
          shoppingCartToUpdate.itemsInCart[i].quantity--;
          itemInCartExist = true;
          if (shoppingCartToUpdate.itemsInCart[i].quantity === 0) {
            console.log(shoppingCartToUpdate.itemsInCart[i].quantity);
            shoppingCartToUpdate.itemsInCart.splice(i, 1);
          }
        }
      }
      if (!itemInCartExist) {
        return new GraphQLError(
          "Sorry, that product is not in the shoppingcart."
        );
      }

      let sum = 0;
      for (let cartItem of shoppingCartToUpdate.itemsInCart) {
        sum += cartItem.quantity * cartItem.price;
      }
      shoppingCartToUpdate.totalSum = sum;

      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },

    emptyAllCartItems: async (_, args) => {
      const { shoppingCartId } = args;
      const shoppingCartFilePath = path.join(
        shoppingCartsDirectory,
        `${shoppingCartId}.json`
      );

      const shoppingCartExists = await fileExists(shoppingCartFilePath);
      if (!shoppingCartExists)
        return new GraphQLError(
          "Sorry, there's been a mistake - that shoppingcart does not exist."
        );

      const shoppingCartToUpdate = await readJsonFile(shoppingCartFilePath);
      let emptyArray = [];
      let totalSum = 0;

      shoppingCartToUpdate.itemsInCart = emptyArray;
      shoppingCartToUpdate.totalSum = totalSum;

      await fsPromises.writeFile(
        shoppingCartFilePath,
        JSON.stringify(shoppingCartToUpdate)
      );

      return shoppingCartToUpdate;
    },
  },
};
