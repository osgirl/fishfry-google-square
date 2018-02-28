function menuItems() {
    this.ingredients = [
        'Hand Breaded Fish',
        'Baked Fish',
        'Hand Breaded Shrimp',
        'Baked Shrimp',
        'Combo Baked Fish & Shrimp',
        'Combo Hand Breaded Fish & Shrimp',
        'Clam Chowder Soup',
        'Mac & Cheese',
        'Grilled Cheese',
        'French Fries',
        'Red Potato'
    ];
    this.meals = [
        'Hand Breaded Fish',
        'Baked Fish',
        'Hand Breaded Shrimp',
        'Baked Shrimp',
        'Combo Baked Fish & Shrimp',
        'Combo Hand Breaded Fish & Shrimp',
        'Mac & Cheese'
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
        'Hand Breaded Fish': new menuItem({
          abbr: 'Fried Fish',
          ingredients: [
            new menuItemIngredient('Fried Fish', 1)
          ],
          serving: 'MEAL'
        }),
        'Hand Breaded Fish (Child)': new menuItem({
          abbr: 'Fried Fish (c)',
          ingredients: [
            new menuItemIngredient('Fried Fish', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Baked Fish': new menuItem({
          abbr: 'Baked Fish',
          ingredients: [
            new menuItemIngredient('Baked Fish', 1)
          ],
          serving: 'MEAL'
        }),
        'Baked Fish (Child)': new menuItem({
          abbr: 'Baked Fish',
          ingredients: [
            new menuItemIngredient('Baked Fish', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Hand Breaded Shrimp': new menuItem({
          abbr: 'Fried Shrimp',
          ingredients: [
            new menuItemIngredient('Fried Shrimp', 1)
          ],
          serving: 'MEAL'
        }),
        'Hand Breaded Shrimp (Child)': new menuItem({
          abbr: 'Fried Shrimp',
          ingredients: [
            new menuItemIngredient('Fried Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Baked Shrimp': new menuItem({
          abbr: 'Baked Shrimp',
          ingredients: [
            new menuItemIngredient('Baked Shrimp', 1)
          ],
          serving: 'MEAL'
        }),
        'Baked Shrimp (Child)': new menuItem({
          abbr: 'Baked Shrimp',
          ingredients: [
            new menuItemIngredient('Baked Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Combo Baked Fish & Shrimp': new menuItem({
          abbr: 'Bakedombo',
          ingredients: [
            new menuItemIngredient('Baked Fish', 0.5),
            new menuItemIngredient('Baked Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Combo Baked Fish & Shrimp (Child)': new menuItem({
          abbr: 'Baked Combo',
          ingredients: [
            new menuItemIngredient('Baked Fish', 0.25),
            new menuItemIngredient('Baked Shrimp', 0.25)
          ],
          serving: 'MEAL'
        }),
        'Combo Hand Breaded Fish & Shrimp': new menuItem({
          abbr: 'Fried Combo',
          ingredients: [
            new menuItemIngredient('Fried Fish', 0.5),
            new menuItemIngredient('Fried Shrimp', 0.5)
          ],
          serving: 'MEAL'
        }),
        'Combo Hand Breaded Fish & Shrimp (Child)': new menuItem({
          abbr: 'Fried Combo',
          ingredients: [
            new menuItemIngredient('Fried Fish', 0.25),
            new menuItemIngredient('Fried Shrimp', 0.25)
          ],
          serving: 'MEAL'
        }),
        'Mac & Cheese': new menuItem({
          abbr: 'Mac & Cheese',
          ingredients: [
            new menuItemIngredient('Mac & Cheese', 1)
          ],
          serving: 'MEAL'
        }),
        'Grilled Cheese': new menuItem({
          ingredients: [
            new menuItemIngredient('Grilled Cheese', 1)
          ],
          serving: 'SIDE'
        }),
        'Clam Chowder Soup': new menuItem({
          abbr: 'Soup',
          ingredients: [
            new menuItemIngredient('Soup', 1)
          ],
          serving: 'SOUP'
        }),
        'French Fries': new menuItem({
          abbr: 'FF',
          ingredients: [
            new menuItemIngredient('French Fries', 1)
          ],
          serving: 'SIDE'
        }),
        'Red Potato': new menuItem({
          abbr: 'Potato',
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
  this.abbr = obj['abbr'];
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