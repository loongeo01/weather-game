import kaplay from "https://unpkg.com/kaplay@4000.0.0-alpha.27.1/dist/kaplay.mjs";
import { getCurrentWeatherData } from "./getWeather.js";

kaplay({ scale: 1, font: "happy", background: [0, 0, 0, 0], canvas: document.getElementById("game"), width: 1536, height: 743, letterbox: true });
setGravity(600);
loadFont("google-sans", "/assets/GoogleSansFlex_9pt-Black.ttf");

setLayers(["layer1", "layer2", "layer3", "layer4", "layer5", "layer6", "beam", "weather", "player"], "player");

// FOR CHARACTER
loadSprite("character", "assets/idle_sheet.png", {
    sliceX: 4,
    sliceY: 5,
    anims: {
        "idle": {
            // Starts from frame 0, ends at frame 3
            from: 0,
            to: 3,
            // Frame per second
            speed: 7,
            loop: true,
        },
        "dragged": {
            // Starts from frame 0, ends at frame 3
            from: 0,
            to: 0,
            // Frame per second
            speed: 5,
            loop: true,
        },
    },
});

loadSprite("characterWalk", "assets/walk_sheet.png", {
    sliceX: 4,
    sliceY: 5,
    anims: {
        "walk": {
            // Starts from frame 0, ends at frame 3
            from: 4,
            to: 7,
            // Frame per second
            speed: 7,
            loop: true,
        },

    },
});

loadSprite("raindrop", "assets/raindrop.png")
loadSprite("shelf", "assets/shelf.png")

loadShader(
    "light",
    null,
    `
        uniform float u_time;
        uniform float u_hit;

        vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
            vec4 c = def_frag();
            
            if (u_hit == 1.0) {
                float t =  ((sin(u_time * 4.0) + 1.0) / 2.0) * 0.4;
                return mix(c, vec4(0.65, 0.70, 0.78, c.a), t);
                
            }

            return c;
        }
        `,
);

// For sound
loadSound("raining", "assets/sounds/rain.mp3");
loadSound("wind", "assets/sounds/wind.mp3");
loadSound("thunder", "assets/sounds/thunder.mp3");

// FRAME
add([
    rect(width(), 90),
    area(),
    pos(0, -90),
    color(41, 31, 84),
    body({ isStatic: true }),
    stay(),
    "top",
]);

add([
    rect(width(), 80),
    layer("player"),
    area(),
    pos(0, height()),
    body({ isStatic: true }),
    color(41, 31, 84),
    stay(),
    "ground",
]);


add([
    rect(200, height() - 10),
    layer("player"),
    area(),
    pos(-200, 0),
    body({ isStatic: true }),
    color(41, 31, 84),
    stay(),
    "left"
]);

add([
    rect(200, height() - 10),
    layer("player"),
    area(),
    pos(width(), 0),
    body({ isStatic: true }),
    color(41, 31, 84),
    stay(),
    "right"
]);





// FOR THUNDER EFFECT
let hit = 0.0
let lightning = null


// RAIN
let parts
let rainSound
let rainSoundWait
function spawnRain(rate, color, speed, opacity) {

    rainSound = play("raining", {
        volume: 0.05,
    });


    rainSoundWait = rainSound.onEnd(() => {
        rainSound.play()
    })


    parts = add([
        layer("weather"),
        pos(0, 0),
        particles({
            max: 500,
            // speed: [600, 700],
            speed: [speed, speed + 100],
            lifeTime: [1, 2.5],
            scales: [1.1, 1],
            // opacities: [0, 0.3, 0],
            opacities: [opacity, 0.4, 0],
            // colors: [Color.fromHex("#d2e0f7")],
            colors: [Color.fromHex(`${color}`)],
            texture: getSprite("raindrop").data.frames[0].tex,
            quads: [getSprite("raindrop").data.frames[0].q],
        }, {
            shape: new Rect(vec2(0), width() + 200, 32),
            lifetime: Infinity,
            rate: rate,
            direction: 120,
            // spread: 5,
        }),
    ]);
    parts.emit(1);

    parts.onEnd(() => {
        destroy(parts);
    });
}

let backgroundObjs = []

// FOR THUNDER EFFECT
var time = 0.69
function timer() {
    if (hit == 1.0) {
        time += 0.04
    }
    if (hit == 0.0) {
        time = 0.69
    }


    return time;

}

let lightningStart
let lightningEnd
let thunderSound
let thunderStart
let thunderEnd
let wind
function spawnBackground(weather, num, speedAmt, startIndex) {

    // Reset background and effects
    if (backgroundObjs) {
        backgroundObjs.forEach((bgObj) => {
            bgObj.forEach((bg) => {
                bg.destroy()
            })
        })
        backgroundObjs = []

        if (lightning != null) {

            lightning.destroy()
            lightning = null

            if (lightningStart) {
                lightningStart.cancel()
                lightningStart = null
            }

            if (lightningEnd) {
                lightningEnd.cancel()
                lightningEnd = null
            }
        }

        if (thunderSound) {
            thunderSound.stop()
        }

        if (thunderStart) {
            thunderStart.cancel()
        }

        if (thunderEnd) {
            thunderEnd.cancel()
        }

        if (rainSound) {
            rainSound.stop()
        }

        if (rainSoundWait) {
            rainSoundWait.cancel()
        }

        if (wind) {
            wind.stop()
        }

        if (parts) {
            parts.destroy()
            parts = null
        }
    }

    // LOADING SPRITES
    for (let i = 1; i < num + 1; i++) {

        if (weather == "thunder" && i == 6) {
            loadSprite("layer6", "assets/background/thunder/6.png", {
                sliceX: 4,
                anims: {
                    "hit": {
                        // Frame per second
                        speed: 40,
                        frames: [0, 1, 2, 3, 0, 0, 0, 1, 2, 3, 0]
                    },
                },
            });
        }
        else {
            loadSprite(`layer${i}`, `assets/background/${weather}/${i}.png`)
        }

    }


    // ADDING GAME OBJECTS
    for (let i = 1, speed = 0; i < num + 1; i++) {

        let gameObjs = [];
        let heights = 0
        let direction = 0
        let startPos = width() - 10

        if (weather == "thunder" && i == 6) {
            lightning = add([
                sprite("layer6"),
                layer("layer3"),
                scale(1.8),
                pos(Math.random() * (width() + 500) - 300, 80),
            ])


            lightningStart = wait((Math.random() * 2) + 5, () => {
                if (lightning != null) {
                    hit = 1.0
                    lightning.play("hit")

                    thunderStart = wait(Math.random() + 1, () => {
                        thunderSound = play("thunder", {
                            volume: 0.01,
                            speed: 1,
                        });
                    })

                }

            })

            lightning.onAnimEnd((anim) => {
                if (lightning == null) return;

                lightning.pos = vec2(Math.random() * (width() + 500) - 300, 100)
                hit = 0.0
                if (anim === "hit" && lightning != null) {
                    lightningEnd = wait((Math.random() * 2) + 7, () => {
                        hit = 1.0
                        lightning.play("hit")

                        thunderEnd = wait(Math.random() + 1, () => {
                            thunderSound.play()
                        })

                    })
                }
            });
        }

        // if current object needs to have another same obj for parallax
        if (i >= startIndex) {

            speed += speedAmt

            // To make last layer move more faster than previous layer
            if (weather == "thunder" && i == 5) {
                speed *= 1.25
            }

            // Change direction of movement
            if (Math.round((Math.random())) == 0) {
                direction = -2
            }
            else {
                direction = 2
            }

            // Change start position depending on the direction the object is moving
            if (direction == 2) {
                startPos = -width() + 10
            }


            // Add another game object beside the original one to maintain parallax
            gameObjs.push(add([
                sprite(`layer${i}`, { width: width(), height: height() + 70 }),
                layer(`layer${i}`),
                scale(1),
                pos(startPos, heights),
                move(vec2(direction, 0), speed),
                `layer${i}`
            ]))

        }

        gameObjs.push(add([
            sprite(`layer${i}`, { width: width(), height: height() + 70 }),
            layer(`layer${i}`),
            scale(1),
            pos(0, heights),
            move(vec2(direction, 0), speed),
            `layer${i}`
        ]))

        // FOR REPOSITIONING OBJECTS TO MAINTAIN PARALLAX
        if (i >= startIndex) {
            gameObjs.forEach((obj, index) => {

                // Reposition object after moving offscreen
                obj.onUpdate(() => {
                    if (parseInt(obj.pos.x) == 0) {
                        gameObjs[1 - index].pos = vec2(startPos, heights)
                    }
                })


                // ONLY FOR THUNDER WEATHER
                if (weather == "thunder" && i >= 2 && i <= 4) {
                    gameObjs[index].use(shader("light", () => ({
                        "u_time": timer(),
                        "u_hit": hit,
                    })),)
                }


            })

        }

        backgroundObjs.push(gameObjs)
    }

    if (weather != "thunder" && !weather.includes("rain")) {
        wind = play("wind", { loop: true, volume: 0.05 })
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// FOR WEATHER INFO
const weatherData = await getCurrentWeatherData();
const currentWeather = weatherData[1].toLowerCase()
let weatherPath = ""

if (currentWeather !== -1) {

    if (
        currentWeather.includes("partly cloudy") ||
        currentWeather.includes("overcast")
    ) {
        weatherPath = "assets/weather_icons/partly_cloudy.png"
    }
    else if (
        currentWeather == "sunny"
    ) {
        weatherPath = "assets/weather_icons/sunny.png"
    }
    else if (
        currentWeather == "cloudy"
    ) {
        weatherPath = "assets/weather_icons/cloudy.png"
    }

    else if (currentWeather.includes("thunder")) {
        weatherPath = "assets/weather_icons/thunder.png"
    }

    else if (currentWeather.includes("patchy rain") || currentWeather.includes("light rain") || currentWeather.includes("drizzle")) {
        weatherPath = "assets/weather_icons/light_rain.png"
    }
    else if (currentWeather.includes("heavy rain") || currentWeather.includes("moderate rain")) {
        weatherPath = "assets/weather_icons/heavy_rain.png"
    }

    else if (currentWeather.includes("haze") || currentWeather.includes("mist")) {
        weatherPath = "assets/weather_icons/haze.png"
    }
    else if (currentWeather.includes("smoke") || currentWeather.includes("smog")) {
        weatherPath = "assets/weather_icons/smoke.png"
    }
}

await loadSprite("weather", weatherPath)

var weatherIcon = add([
    sprite("weather", { width: 265, height: 265 }),
    layer("weather"),
    pos((width() * 0.008), height() * 0.62),
    stay(),
])

const temperature = add([
    layer("weather"),
    text(weatherData[0] + "°C", { font: "google-sans", size: 70 }),
    pos(weatherIcon.pos.x + 280, weatherIcon.pos.y + 90),
    stay(),
])

const weatherCondition = add([
    layer("weather"),
    text(weatherData[1], { font: "google-sans", size: 25 }),
    pos(weatherIcon.pos.x + 280, temperature.pos.y + 80),
    stay(),
])

// FOR BACKGROUND
const currentTime = new Date();
const eveningStart = new Date();
eveningStart.setHours(17, 0, 0); // 5.00 pm
const eveningEnd = new Date();
eveningEnd.setHours(19, 0, 0); // 7.00 pm


function createBackground() {

    let rainColor = "#d2e0f7";
    let rainOpacity = 0;

    if (currentWeather.includes("cloudy")) {
        spawnBackground("cloudy", 4, 5, 3);
    }
    else if (currentWeather.includes("sunny")) {

        // Check if it is evening
        if (currentTime >= eveningStart && currentTime <= eveningEnd)
            spawnBackground("evening_sunny", 4, 5, 3);
        // Check if daytime
        else if (currentTime < eveningStart) {
            spawnBackground("sunny", 6, 2, 3);
        }

    }
    else if (currentWeather.includes("clear")) {
        spawnBackground("night_clear", 4, 5, 3);
    }
    else if (currentWeather.includes("thunder")) {
        spawnBackground("thunder", 6, 2, 2);
        spawnRain(500, "#d2e0f7", 600, 0);
    }
    else if (currentWeather.includes("rain")) {


        if (currentWeather.includes("heavy")) {
            spawnBackground("heavy_rain", 5, 2, 2)
        }
        // Check if it is evening
        else if (currentTime >= eveningStart && currentTime <= eveningEnd) {
            spawnBackground("rain_evening", 4, 5, 3);
        }
        // Check if daytime
        else if (currentTime < eveningStart) {
            rainColor = "#5b6d82"
            rainOpacity = 0.1
            spawnBackground("rain_day", 5, 3, 3);
        }
        // Check if night time
        else if (currentTime > eveningEnd) {
            spawnBackground("rain_night", 4, 3, 2);
        }

        // Spawn different rain depending on rain type
        if (currentWeather.includes("light") || currentWeather.includes("patchy")) {
            spawnRain(100, rainColor, 400, rainOpacity);
        }
        else if (currentWeather.includes("moderate")) {
            spawnRain(200, rainColor, 400, rainOpacity);
        }
        else if (currentWeather.includes("heavy") || currentWeather.includes("torrential")) {
            spawnRain(500, rainColor, 600, rainOpacity);
        }
    }
    else if (currentWeather.includes("haze") || currentWeather.includes("smog")) {
        spawnBackground("haze", 3, 5, 2);
    }

}
// GAME
scene("game", async () => {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    createBackground()

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Keep track of the current draggin item
    let curDraggin = null;

    // CHARACTER


    const guy = add([
        sprite("character"),
        layer("player"),
        pos(rand(width()), rand(height())),
        anchor("center"),
        area({ shape: Rect.fromPoints(vec2(0, 4), vec2(15, 29)), collisionIgnore: ["player", "window-middle", "window-middle2", "beam"] }),
        body(),
        drag(),
        test(),
        stay(),
        state("idle", ["idle", "move", "dragged"]),
        "player"
    ]);

    // STATES
    guy.onStateEnter("idle", async () => {

        if (guy.isGrounded()) {
            guy.use(sprite("character"));
            guy.play("idle")
        }


        guy.use(move(vec2(0, 0), 0));
        await wait((Math.random() * 2) + 1);
        guy.enterState("move")



    });

    guy.onStateEnter("move", async () => {

        if (guy.isGrounded()) {
            let direction = (Math.random() * 4) - 2
            guy.use(move(vec2(direction, 0), 50));



            // if going left
            if (direction < 0) {
                guy.use(sprite("characterWalk", { flipX: true }));
                guy.play("walk")
            }
            // if going right
            else {
                guy.use(sprite("characterWalk"));
                guy.play("walk")
            }

        }


        await wait((Math.random() * 3) + 2);

        guy.enterState("idle");

    });


    guy.onDrag(() => {
        readd(guy);
        guy.use(sprite("character"));
        guy.play("dragged")

    });

    guy.onDragUpdate(() => {

        guy.use(move(vec2(0, 0), 0));

        guy.vel.x = 0
        guy.vel.y = 0
        setCursor("grab");
    });






    function test() {
        return {
            update() {
                let nextVelocity = this.vel.add(vec2(0, 600 * dt()))
                let nextDisplacement =
                    ((this.vel.add(nextVelocity)).scale(0.5)).scale(dt())

                // Don't try to normalize a zero-length displacement
                if (nextDisplacement.len() === 0) {
                    return;
                }

                let direction = nextDisplacement.unit()
                let normal = direction.normal()

                const halfWidth = 7.5;
                const halfHeight = 12.5;

                /*
                 * Find the maximum distance we can move along the
                 * perpendicular direction while still being inside
                 * the collision rectangle.
                 *
                 * This gives us the positions of the two outer rays.
                 */
                const perpendicularExtent =
                    Math.min(
                        Math.abs(halfWidth / normal.x),
                        Math.abs(halfHeight / normal.y)
                    );

                /*
                 * Given a point inside the rectangle that is offset
                 * perpendicular to the movement direction, find how
                 * far forward we can move before reaching the edge.
                 */
                function makeRay(lateralOffset) {
                    const lateral = normal.scale(lateralOffset);

                    const x = Math.abs(lateral.x);
                    const y = Math.abs(lateral.y);

                    const forwardX =
                        Math.abs(direction.x) > 0.00001
                            ? (halfWidth - x) / Math.abs(direction.x)
                            : Infinity;

                    const forwardY =
                        Math.abs(direction.y) > 0.00001
                            ? (halfHeight - y) / Math.abs(direction.y)
                            : Infinity;

                    const forwardOffset = Math.min(forwardX, forwardY);

                    const rayOffset =
                        lateral.add(direction.scale(forwardOffset));

                    return {
                        origin: this.pos.add(rayOffset),
                        offset: rayOffset,
                    };
                }

                /*
                 * Three rays:
                 *
                 *       ray1
                 *        |
                 *        |
                 *        ray
                 *        |
                 *        |
                 *       ray3z
                 *
                 * All three start ON the collision box.
                 */
                const ray1 = makeRay.call(this, -perpendicularExtent);
                const ray = makeRay.call(this, 0);
                const ray3 = makeRay.call(this, perpendicularExtent);

                const rayOrigin1 = ray1.origin;
                const rayOrigin = ray.origin;
                const rayOrigin3 = ray3.origin;

                const MAX_TRACE_DEPTH = 1;
                let traceDepth = 0;

                while (traceDepth < MAX_TRACE_DEPTH) {

                    var shortestDistance = 10000;
                    var shortest = -1;
                    var shortestOffset = null;

                    var hit1 = raycast(
                        rayOrigin1,
                        nextDisplacement,
                        ["player"]
                    );

                    var hit = raycast(
                        rayOrigin,
                        nextDisplacement,
                        ["player"]
                    );

                    var hit3 = raycast(
                        rayOrigin3,
                        nextDisplacement,
                        ["player"]
                    );

                    if (!hit1 && !hit && !hit3) {
                        break;
                    }

                    if (hit1 && rayOrigin1.dist(hit1.point) < shortestDistance) {
                        shortestDistance = rayOrigin1.dist(hit1.point);
                        shortest = hit1;
                        shortestOffset = ray1.offset;
                    }

                    if (hit && rayOrigin.dist(hit.point) < shortestDistance) {
                        shortestDistance = rayOrigin.dist(hit.point);
                        shortest = hit;
                        shortestOffset = ray.offset;
                    }

                    if (hit3 && rayOrigin3.dist(hit3.point) < shortestDistance) {
                        shortestDistance = rayOrigin3.dist(hit3.point);
                        shortest = hit3;
                        shortestOffset = ray3.offset;
                    }

                    /*
                     * The ray started at:
                     *
                     *     this.pos + shortestOffset
                     *
                     * So if it hits at:
                     *
                     *     shortest.point
                     *
                     * the corresponding object position is:
                     *
                     *     shortest.point - shortestOffset
                     *
                     * This puts the SAME point on the collision box
                     * exactly where the ray hit the wall.
                     */


                    this.pos = shortest.point.sub(shortestOffset);

                    this.vel = vec2(0, 0);

                    this.applyImpulse(
                        nextDisplacement
                            .reflect(shortest.normal)
                            .scale(30)
                    );

                    traceDepth++;
                }
            },
        };
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    loadSprite("changeBackground", "assets/background.png")
    loadSprite("cloud", "assets/background_icons/cloud.png")
    loadSprite("rain", "assets/background_icons/rain.png")
    loadSprite("sun", "assets/background_icons/sun.png")
    loadSprite("thunder", "assets/background_icons/thunder.png")
    loadSprite("reload", "assets/background_icons/reloading.png")

    let toggled = false

    // Buttons
    const btnChangeBackground = add([
        sprite("changeBackground", { width: 40, height: 42 }),
        pos(width() - 105, 55),
        area(),
        scale(1),
        anchor("center"),
        stay(),
        "changeBackground"
    ]);

    let backgroundIcons = [];

    for (let i = 0, spriteName = "", increment = 50; i < 5; i++) {
        let size = 1


        switch (i) {
            case 0:
                spriteName = "cloud"
                break;
            case 1:
                spriteName = "sun"
                break;
            case 2:
                spriteName = "rain"
                break;
            case 3:
                spriteName = "thunder"
                size = 0.8
                break;
            case 4:
                spriteName = "reload"
                size = 0.8
                break;
        }

        const icon = add([
            sprite(spriteName, { width: 28, height: 28 }),
            scale(size),
            pos(btnChangeBackground.pos.x - increment, 55),
            anchor("center"),
            opacity(0),
            stay(),
            area(),
            spriteName,
        ]);

        backgroundIcons.push(icon);
        icon.onClick(() => {
            if (toggled) {
                switch (spriteName) {
                    case "sun":
                        if (currentTime >= eveningStart && currentTime <= eveningEnd)
                            spawnBackground("evening_sunny", 4, 5, 3);
                        // Check if daytime
                        else if (currentTime < eveningStart) {
                            spawnBackground("sunny", 6, 2, 3);
                        }
                        break;
                    case "rain":
                        if (currentTime >= eveningStart && currentTime <= eveningEnd) {
                            spawnBackground("rain_evening", 4, 5, 3);
                            spawnRain(100, "#d2e0f7", 400, 0);
                        }
                        // Check if daytime
                        else if (currentTime < eveningStart) {
                            spawnBackground("rain_day", 5, 3, 3);
                            spawnRain(100, "#5b6d82", 400, 0);
                        }
                        // Check if night time
                        else if (currentTime > eveningEnd) {
                            spawnBackground("rain_night", 4, 3, 2);
                            spawnRain(100, "#d2e0f7", 400, 0);
                        }

                        break;
                    case "cloud":
                        spawnBackground("cloudy", 4, 5, 3);
                        break;
                    case "thunder":
                        spawnBackground("thunder", 6, 2, 2);
                        spawnRain(500, "#d2e0f7", 600, 0);
                        break;
                    case "reload":
                        createBackground()
                        break;
                }
            }

        });
        increment += 50
    }




    onClick("changeBackground", () => {
        backgroundIcons.forEach((bg) => {
            if (bg.opacity == 0) {
                bg.opacity = 1
                toggled = true

            }
            else {
                bg.opacity = 0
                toggled = false
            }

        })

    })


    const btnAdd = add([
        rect(30, 30),
        pos(width() - 55, 55),
        area(),
        scale(1),
        anchor("center"),
        outline(4),
        color(255, 255, 255),
        stay(),
        "addButton"
    ]);

    btnAdd.add([
        text("+"),
        anchor("center"),
        color(0, 0, 0),
        stay(),
    ]);

    onClick("addButton", () => {
        const guy = add([
            sprite("character"),
            layer("player"),
            pos(rand(width()), rand(height())),
            anchor("center"),
            area({ shape: Rect.fromPoints(vec2(0, 4), vec2(15, 29)), collisionIgnore: ["player", "window-middle", "window-middle2", "beam"] }),
            body(),
            drag(),
            test(),
            stay(),
            state("idle", ["idle", "move", "dragged"]),
            "player"
        ]);

        // STATES
        guy.onStateEnter("idle", async () => {

            if (guy.isGrounded()) {
                guy.use(sprite("character"));
                guy.play("idle")
            }


            guy.use(move(vec2(0, 0), 0));
            await wait((Math.random() * 2) + 1);
            guy.enterState("move")



        });

        guy.onStateEnter("move", async () => {

            if (guy.isGrounded()) {
                let direction = (Math.random() * 4) - 2
                guy.use(move(vec2(direction, 0), 50));



                // if going left
                if (direction < 0) {
                    guy.use(sprite("characterWalk", { flipX: true }));
                    guy.play("walk")
                }
                // if going right
                else {
                    guy.use(sprite("characterWalk"));
                    guy.play("walk")
                }

            }


            await wait((Math.random() * 3) + 2);

            guy.enterState("idle");

        });


        guy.onDrag(() => {
            readd(guy);
            guy.use(sprite("character"));
            guy.play("dragged")

        });

        guy.onDragUpdate(() => {

            guy.use(move(vec2(0, 0), 0));

            guy.vel.x = 0
            guy.vel.y = 0
            setCursor("grab");
        });



        guy.onCollideUpdate("ground", () => {

            // debug.log(guy.vel)
            if (parseInt(guy.vel.x) != 0) {
                guy.vel = guy.vel.sub(vec2(guy.vel.x * 0.02, 0))
            }

            else if (parseInt(guy.vel.x) == 0) {
                guy.vel = vec2(0, 0)
            }

        })

    })

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // EVENTS AND PHYSICS
    function drag() {
        // The displacement between object pos and mouse pos
        let offset = vec2(0);

        return {
            // Name of the component
            id: "drag",
            // This component requires the "pos" and "area" component to work
            require: ["pos", "area"],
            pick() {
                // Set the current global dragged object to this
                curDraggin = this;
                offset = mousePos().sub(this.pos);
                this.trigger("drag");
            },
            // "update" is a lifecycle method gets called every frame the obj is in scene
            update() {
                if (curDraggin === this) {
                    this.pos = mousePos().sub(offset);
                    this.trigger("dragUpdate");
                }
                // debug.log(guy.pos)
            },
            onDrag(action) {
                return this.on("drag", action);
            },
            onDragUpdate(action) {
                return this.on("dragUpdate", action);
            },
            onDragEnd(action) {
                return this.on("dragEnd", action);
            },
        };
    }


    onUpdate(() => {
        setCursor("default")
    }

    );

    // Check if someone is picked
    onMousePress((m) => {
        if (m === "left") {
            if (curDraggin) {
                return;
            }

            for (const obj of get("drag").reverse()) {
                // If mouse is pressed and mouse position is inside, we pick
                if (obj.isHovering()) {
                    obj.pick();
                    break;
                }
            }

        }

    });


    var d1 = vec2(0, 0)
    var d2 = vec2(0, 0)
    var d3 = vec2(0, 0)
    onMouseMove((p, d) => {
        if (curDraggin) {
            if (d1 == 0) {
                d1 = d
            }
            else if (d2 == 0) {
                d2 = d
            }
            else if (d3 == 0) {
                d3 = d
            }
            // new chain
            else {
                d1 = d2
                d2 = d3
                d3 = d
            }
        }

    })

    // Drop whatever is dragged on mouse release
    onMouseRelease(() => {
        if (curDraggin) {
            var distance = (d1.add(d2)).add(d3)
            curDraggin.applyImpulse(vec2(distance.x * 5, distance.y * 5));
            curDraggin = null;

            d1 = vec2(0, 0)
            d2 = vec2(0, 0)
            d3 = vec2(0, 0)
        }
    });


    onCollideUpdate("player", "ground", (a, b) => {
        if (parseInt(a.vel.x) != 0) {
            a.vel = a.vel.sub(vec2(a.vel.x * 0.02, 0))
        }

        else if (parseInt(a.vel.x) == 0) {
            a.vel = vec2(0, 0)
        }

    })

});


go("game");