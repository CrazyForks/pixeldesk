const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAP_PATH = path.join(__dirname, '../public/assets/officemap.json');

// List of object layers that contain workstations/interactables needing stable IDs
const TARGET_LAYERS = [
    'desk_objs',
    'bookcase_objs',
    'front_desk_objs',
    'washroom/washroom_objs' // Nested or named with slash? Tiled usually flattens or groups.
];

function generateId() {
    return crypto.randomUUID();
}

function processLayer(layer) {
    let modifiedCount = 0;

    if (layer.type === 'objectgroup') {
        // Check if this is a target layer or generic object layer we want to process
        // For safety, let's process ALL object layers, but only add ws_id to objects that look like workstations/interactables
        // OR simply process all objects in specific layers.

        // Strategy: Process all objects in the specified target layers.
        // Also handle groups if Tiled uses them.
        if (TARGET_LAYERS.includes(layer.name) || layer.name.includes('_objs')) {
            console.log(`Processing layer: ${layer.name} (${layer.objects.length} objects)`);

            layer.objects.forEach(obj => {
                if (!obj.properties) {
                    obj.properties = [];
                }

                // Check if ws_id already exists
                const existingProp = obj.properties.find(p => p.name === 'ws_id');

                if (!existingProp) {
                    const newId = generateId();
                    obj.properties.push({
                        name: 'ws_id',
                        type: 'string',
                        value: newId
                    });
                    // console.log(`  + Assigned ID ${newId} to object ${obj.id} (${obj.name || 'unnamed'})`);
                    modifiedCount++;
                } else {
                    // console.log(`  = Object ${obj.id} already has ID ${existingProp.value}`);
                }
            });
        }
    } else if (layer.type === 'group' && layer.layers) {
        // Recursive for groups
        layer.layers.forEach(subLayer => {
            modifiedCount += processLayer(subLayer);
        });
    }

    return modifiedCount;
}

try {
    console.log(`Reading map from ${MAP_PATH}...`);
    const rawData = fs.readFileSync(MAP_PATH, 'utf8');
    const mapData = JSON.parse(rawData);

    let totalModified = 0;

    mapData.layers.forEach(layer => {
        totalModified += processLayer(layer);
    });

    if (totalModified > 0) {
        console.log(`Writing changes to file... (${totalModified} objects updated)`);
        fs.writeFileSync(MAP_PATH, JSON.stringify(mapData, null, 2), 'utf8'); // Pretty print 2 spaces logic might diff huge, but Tiled exports minified usually? NO, usually pretty.
        // Tiled JSON format can value compactness. Let's try to keep it standard.
        // If the original file was compact, this might explode lines.
        // But for safety and diffing, pretty print is better.
        console.log('Done!');
    } else {
        console.log('No objects needed updating.');
    }

} catch (error) {
    console.error('Error processing map:', error);
}
