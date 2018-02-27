function menuItems() {
    this.ingredients = [
        'Breaded Fish',
        'Baked Fish',
        'Breaded Shrimp',
        'Baked Shrimp',
//        'COMBO FF FS',
//        'COMBO FF BS',
//        'COMBO BF FS',
//        'COMBO BF BS',
        'Clam Chowder',
        'Mac & Cheese',
        'Grilled Cheese',
        'French Fries',
        'Red Potato'
    ];
    this.meals = [
        'Breaded Fish',
        'Baked Fish',
        'Breaded Shrimp',
        'Baked Shrimp'
    ];
    this.sides = [
        'Mac & Cheese',
        'Grilled Cheese',
        'French Fries',
        'Red Potato'
    ];
    this.types = [
        'MEAL',
        'SIDE',
        'SOUP'
    ];
    // TODO: get menu items from Square
    this.items = {
        'Breaded Fish': new menuItem({
          ingredients: [
            new menuItemIngredient('Breaded Fish', 1)
          ],
          serving: 'MEAL'
        }),
        'Breaded Fish (Child)': new menuItem({
          ingredients: [
            new menuItemIngredient('Breaded Fish', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Baked Fish': new menuItem({
          ingredients: [
            new menuItemIngredient('Baked Fish', 1)
          ],
          serving: 'MEAL'
        }),
        'Baked Fish (Child)': new menuItem({
          ingredients: [
            new menuItemIngredient('Baked Fish', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Breaded Shrimp': new menuItem({
          ingredients: [
            new menuItemIngredient('Breaded Shrimp', 1)
          ],
          serving: 'MEAL'
        }),
        'Breaded Shrimp (Child)': new menuItem({
          ingredients: [
            new menuItemIngredient('Breaded Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Baked Shrimp': new menuItem({
          ingredients: [
            new menuItemIngredient('Baked Shrimp', 1)
          ],
          serving: 'MEAL'
        }),
        'Baked Shrimp (Child)': new menuItem({
          ingredients: [
            new menuItemIngredient('Baked Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
//        'COMBO FF FS': new menuItem({
//          ingredients: [
//            new menuItemIngredient('Breaded Fish', 0.5),
//            new menuItemIngredient('Breaded Shrimp', 0.5)
//          ],
//          serving: 'MEAL'
//        }),
//        'COMBO FF BS': new menuItem({
//          ingredients: [
//            new menuItemIngredient('Breaded Fish', 0.5),
//            new menuItemIngredient('Baked Shrimp', 0.5)
//          ],
//          serving: 'MEAL'
//        }),
//        'COMBO BF FS': new menuItem({
//          ingredients: [
//            new menuItemIngredient('Baked Fish', 0.5),
//            new menuItemIngredient('Breaded Shrimp', 0.5)
//          ],
//          serving: 'MEAL'
//        }),
//        'COMBO BF BS': new menuItem({
//          ingredients: [
//            new menuItemIngredient('Baked Fish', 0.5),
//            new menuItemIngredient('Baked Shrimp', 0.5)
//          ],
//          serving: 'MEAL'
//        }),
        'Mac & Cheese': new menuItem({
          ingredients: [
            new menuItemIngredient('Mac & Cheese', 1)
          ],
          serving: 'SIDE'
        }),
        'Grilled Cheese': new menuItem({
          ingredients: [
            new menuItemIngredient('Grilled Cheese', 1)
          ],
          serving: 'SIDE'
        }),
        'Clam Chowder': new menuItem({
          ingredients: [
            new menuItemIngredient('Clam Chowder', 1)
          ],
          serving: 'SOUP'
        }),
        'French Fries': new menuItem({
          ingredients: [
            new menuItemIngredient('French Fries', 1)
          ],
          serving: 'SIDE'
        }),
        'Red Potato': new menuItem({
          ingredients: [
            new menuItemIngredient('Red Potato', 1)
          ],
          serving: 'SIDE'
        })
    };
}

menuItems.prototype.servingCount = function(serving_type) {
    var total = 0;
    for (var i in this.items) {
        if (this.items[i].serving === serving_type) {
            total += this.items[i].quantity;
        }
    }
    return total;
}

menuItems.prototype.ingredientTotals = function() {
    var total = {};
    var that = this;
    Object.keys(this.items).forEach(function (key) {
      that.items[key].ingredients.forEach(function (ingredient) {
        if (!(ingredient.name in total)) {
            total[ingredient.name] = 0;
        }
        total[ingredient.name] += that.items[key].quantity * ingredient.quantity;
      });
    });
    return total;
}


function menuItem(obj) {
    this.ingredients = obj['ingredients'];
    this.serving = obj['serving'];
    this.quantity = 0;

}

menuItem.prototype.increment_quantity = function(quantity) {
    this.quantity += parseInt(quantity)
}

function menuItemIngredient(ingredient, qty) {
    this.name = ingredient;
    this.quantity = qty;
}