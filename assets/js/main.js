// utility function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// toggle the mobile menu
$('#navbar-toggle').on('click', function() {
    $('#navbar-default').toggleClass('hidden');
});

// hide the mobile menu when a link is clicked
$('#navbar-default a').on('click', function() {
    $('#navbar-default').addClass('hidden');
});

$(document).ready(function() {
    // setup collapsible sections
    function setupCollapsible() {
        $(".collapsible").on("click", function() {
            $(this).toggleClass("active");
            const content = $(this).next();
            $(".content").css("display", "none");
            content.css("display", content.css("display") === "block" ? "none" : "block");
        });
    }

    // fetch Pokémon names and populate collapsible sections
    async function populatePokemonNames() {
        const cachedData = localStorage.getItem('pokemonList');
        let pokemonList;

        if (cachedData) {
            pokemonList = JSON.parse(cachedData);
        } else {
            const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
            const data = await response.json();
            pokemonList = data.results;
            localStorage.setItem('pokemonList', JSON.stringify(pokemonList));
        }

        const groupSelectors = ["ab", "cd", "eg", "hj", "km", "np", "qs", "tv", "wz"];
        const groups = Object.fromEntries(groupSelectors.map(key => [key, $(`#group-${key}`)]));
        const groupedPokemon = Object.fromEntries(groupSelectors.map(key => [key, []]));

        pokemonList.forEach(pokemon => {
            const name = capitalizeFirstLetter(pokemon.name);
            for (const key of groupSelectors) {
                if (name.match(new RegExp(`^[${key.toUpperCase()}${key}]`))) {
                    groupedPokemon[key].push(name);
                    break;
                }
            }
        });

        for (const key of groupSelectors) {
            groupedPokemon[key].sort().forEach(name => {
                $("<p>")
                    .attr("id", "collapsible-search")
                    .addClass("pokemon-link")
                    .text(name)
                    .on("click", function() {
                        const content = $(this).parent();
                        content.css("display", "none");
                        content.prev().removeClass("active");
                    })
                    .appendTo(groups[key]);
            });
        }

        console.log(groupedPokemon);
    }

    // fetch Pokémon genus
    async function fetchPokemonGenus(pokemonName) {
        const cachedData = localStorage.getItem(`genus-${pokemonName}`);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
            if (!response.ok) throw new Error(`Error: Unable to fetch data for ${pokemonName}`);

            const data = await response.json();
            const genusEntry = data.genera.find(entry => entry.language.name === "en");
            const genus = genusEntry ? genusEntry.genus : "Genus information not available";
            localStorage.setItem(`genus-${pokemonName}`, genus);
            return genus;
        } catch (error) {
            console.error(error);
            return "Error fetching genus information";
        }
    }

    // fetch ability description
    async function fetchAbilityDescription(url) {
        const cachedData = localStorage.getItem(url);
        if (cachedData) {
            return cachedData;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Ability network response was not ok");

        const data = await response.json();
        const descriptionEntry = data.effect_entries.find(entry => entry.language.name === "en");
        const description = descriptionEntry ? descriptionEntry.effect : "No description available.";
        localStorage.setItem(url, description);
        return description;
    }

    // fetch Pokémon game versions
    async function fetchPokemonGameVersions(pokemonName) {
        const cachedData = localStorage.getItem(`versions-${pokemonName}`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        if (!response.ok) throw new Error(`Error: Unable to fetch data for ${pokemonName}`);

        const data = await response.json();
        const gameVersions = data.game_indices.map(index => capitalizeFirstLetter(index.version.name));
        localStorage.setItem(`versions-${pokemonName}`, JSON.stringify(gameVersions));
        return gameVersions;
    }

    // fetch flavor text
    async function fetchFlavorText(pokemonName) {
        const cachedData = localStorage.getItem(`flavorText-${pokemonName}`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
        if (!response.ok) throw new Error(`Error: Unable to fetch flavor text for ${pokemonName}`);

        const data = await response.json();
        const flavorTexts = data.flavor_text_entries
            .filter(entry => entry.language.name === "en")
            .slice(0, 1)
            .map(entry => entry.flavor_text.replace(/\n|\f/g, ' '));
        localStorage.setItem(`flavorText-${pokemonName}`, JSON.stringify(flavorTexts));
        return flavorTexts;
    }

    // fetch evolution chain
    function fetchEvolutionChain(chain) {
        const evolutions = [];
        let current = chain;

        while (current) {
            evolutions.push(current.species.name);
            current = current.evolves_to.length > 0 ? current.evolves_to[0] : null;
        }
        return evolutions;
    }

    // fetch Pokémon data and display on page
    async function fetchPokemon(event) {
        event.preventDefault();

        const idValueEl = $("#pokemon-id-value").text("");
        const nameValueEl = $("#pokemon-name-value").text("");
        const spriteEl = $("#pokemon-sprite").attr("src", "");
        const typeValueEl = $("#pokemon-type-value").text("");
        const flavorTextValueEl = $("#pokemon-flavor-text-value").text("");
        const statsValueEl = $("#pokemon-stats-value").text("");
        const heightValueEl = $("#pokemon-height-value").text("");
        const weightValueEl = $("#pokemon-weight-value").text("");
        const abilitiesValueEl = $("#pokemon-abilities-value").text("");
        const hiddenAbilitiesValueEl = $("#pokemon-hidden-abilities-value").text("");
        const gameVersionsValueEl = $("#pokemon-versions-value").text("");
        const evolutionValueEl = $("#pokemon-evolution-value").html("");

        try {
            const name = $("#pokemon-name").val().toLowerCase();
            const cachedData = localStorage.getItem(`pokemonData-${name}`);
            let data;

            if (cachedData) {
                data = JSON.parse(cachedData);
            } else {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
                if (!response.ok) throw new Error("Network response was not ok");

                data = await response.json();
                localStorage.setItem(`pokemonData-${name}`, JSON.stringify(data));
            }

            localStorage.setItem('lastPokemon', name);

            const pokemonName = capitalizeFirstLetter(data.name);
            const pokemonGenus = await fetchPokemonGenus(name);
            const pokemonId = data.id;
            const pokemonSprite = data.sprites.front_default;
            const pokemonType = data.types.map(typeInfo => capitalizeFirstLetter(typeInfo.type.name)).join(', ');
            const pokemonStats = data.stats.map(statInfo => `${capitalizeFirstLetter(statInfo.stat.name)}: ${statInfo.base_stat}`).join(', ');
            const pokemonHeight = data.height / 10;
            const pokemonWeight = data.weight / 10;

            const abilityDescrip = await Promise.all(data.abilities.map(async abilityInfo => ({
                name: capitalizeFirstLetter(abilityInfo.ability.name),
                description: await fetchAbilityDescription(abilityInfo.ability.url),
            })));

            const pokemonAbilities = abilityDescrip.filter((_, index) => !data.abilities[index].is_hidden);
            const pokemonHiddenAbilities = abilityDescrip.filter((_, index) => data.abilities[index].is_hidden);

            $("#search-result-header").text(`${pokemonName}, ${pokemonGenus}`).html(function(_, html) {
                return html.replace(pokemonGenus, `<i class="font-thin text-gray-500">${pokemonGenus}</i>`);
            }).css("display", "block");

            idValueEl.text(pokemonId.toString().padStart(5, '0'));
            $("#pokemon-id").css("display", "block");

            nameValueEl.text(pokemonName || "No information found");
            $("#pokemon-name-display").css("display", "block");

            $("#pokemon-genus-value").text(pokemonGenus || "No information found");
            $("#pokemon-genus").css("display", "block");

            spriteEl.attr("src", pokemonSprite || "").css("display", "block");

            typeValueEl.text(pokemonType || "No information found");
            $("#pokemon-type").css("display", "block");

            const flavorTexts = await fetchFlavorText(name);
            flavorTextValueEl.text(flavorTexts.join('') || "No information found");
            $("#pokemon-flavor-text").css("display", "block");

            statsValueEl.text(pokemonStats || "No information found");
            $("#pokemon-stats").css("display", "block");

            heightValueEl.text(pokemonHeight ? `${pokemonHeight} m` : "No information found");
            $("#pokemon-height").css("display", "block");

            weightValueEl.text(pokemonWeight ? `${pokemonWeight} kg` : "No information found");
            $("#pokemon-weight").css("display", "block");

            displayAbilities(pokemonAbilities, abilitiesValueEl, "#pokemon-abilities");
            displayAbilities(pokemonHiddenAbilities, hiddenAbilitiesValueEl, "#pokemon-hidden-abilities");

            const gameVersions = await fetchPokemonGameVersions(name);
            gameVersionsValueEl.text(gameVersions.join(', ') || "No game versions found.");
            $("#pokemon-versions").css("display", "block");

            const speciesResponse = await fetch(data.species.url);
            if (!speciesResponse.ok) throw new Error("Species network response was not ok");

            const speciesData = await speciesResponse.json();
            const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
            if (!evolutionChainResponse.ok) throw new Error("Evolution chain network response was not ok");

            const evolutionChainData = await evolutionChainResponse.json();
            const evolutionChain = fetchEvolutionChain(evolutionChainData.chain);
            displayEvolutionChain(evolutionChain, evolutionValueEl);

        } catch (error) {
            console.log(error);
        }
    }

    function displayAbilities(abilities, element, container) {
        if (abilities.length > 0) {
            abilities.forEach(ability => {
                const abilityElement = $('<span class="ability-link text-gray-700 underline cursor-pointer">')
                    .text(ability.name)
                    .data('description', ability.description)
                    .on('click', function() {
                        showAbilityDescription($(this).data('description'));
                    });
                element.append(abilityElement);
                if (abilities.indexOf(ability) !== abilities.length - 1) {
                    element.append(', ');
                }
            });
            $(container).css("display", "block");
        } else {
            element.text("No abilities found.");
        }
    }

    function displayEvolutionChain(evolutionChain, element) {
        if (evolutionChain.length > 0) {
            element.html(evolutionChain.map(name => `<a href="#" class="pokemon-link pokemon-chain">${capitalizeFirstLetter(name)}</a>`).join(' -> '));
            $(".pokemon-chain").css({"text-decoration": "underline" });
            $("#pokemon-evolution").css("display", "block");
        } else {
            element.html("No evolution chain found.");
            $("#pokemon-evolution").css("display", "none");
        }
    }

    function showAbilityDescription(description) {
        $('#ability-modal').find('#ability-modal-content').text(description).end().removeClass('hidden');
    }

    function closeModal() {
        $('#ability-modal').addClass('hidden');
    }

    // initialize collapsible sections and populate Pokémon names
    setupCollapsible();
    populatePokemonNames();

    // load the last searched Pokémon or Bulbasaur if none is found
    const lastPokemon = localStorage.getItem('lastPokemon') || 'bulbasaur';
    $("#pokemon-name").val(lastPokemon);
    fetchPokemon(new Event('submit'));

    // event delegation and listeners
    $(document).on("click", "#collapsible-search", function(event) {
        const pokemonName = $(this).text().toLowerCase();
        $("#pokemon-name").val(pokemonName);
        fetchPokemon(event);
    });

    $("#pokemon-evolution-value").on("click", ".pokemon-link", function(event) {
        const pokemonName = $(this).text().toLowerCase();
        $("#pokemon-name").val(pokemonName);
        fetchPokemon(event);
    });

    $("#search-button").on("click", fetchPokemon);
    $("#ability-modal-close").on("click", closeModal);
});
