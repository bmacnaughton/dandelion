/*******************************************************************************
 * 
 * Copyright 2011 Zack Grossbart 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Modifications Copyright 2016 Bruce A. MacNaughton
 *
 * Significant changes were made to the original software.
 *
 ******************************************************************************/

//
// Colors for the dandelion
//
var seedBulbColor = '#d0aa7b';
var stemColor = '#567e37';
var wispColor = '#fff3c9';
var seedStemColor = stemColor;

var maxEdgeSeeds = 1000;         // calculated using circumference of bulb
var maxCenterSeeds = 36;         // how many seeds to put in the center

// the following are used for debugging
//maxEdgeSeeds = 1;
//maxCenterSeeds = 0;
//seedStemColor = 'black';


/**
 * This script uses a lot of random numbers to make everything
 * look more natural.  This function is just an easy way to
 * generate random numbers between two numbers. 
 *  
 * @param from the minimum integer
 * @param to the maximum integer
 */
function random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

//
// force angles to the range from 0 to 360, not including 360.
//
function coerce(angle) {
    return ((angle % 360) + 360) % 360;
}


var seedStemLow = 10;
var seedStemHigh = 50;
seedStemLow = 20;
seedStemHigh = 30;

/**
 * This function acts like an object in paperscript.  It
 * represents each seed on the dandelion and handles drawing and
 * moving the seed.
 */
function Seed() {
    var wispMin = 6;
    var wispMax = 10;

    //
    // create a seed at the specified point. the point is where the center
    // of the oval at the bottom of the seed is positioned.
    //
    // @param p the point for the center of the oval where the seed is attached
    // @param angle the angle to rotate the seed around the seed's oval
    // @param stemHeight - how long to make the stem
    //
    this.create = function (p, angle, stemHeight) {

        // group all the seed parts together so it can be manipulated as
        // a single unit
        var group = new Group();

        // now draw the seed. start with a small ovall at the bottom
        // where it attaches to the bulb.
        var bottom = new Path.Ellipse({
            center: p,
            radius: [2, 5],
            fillColor: seedBulbColor,
            opacity: 0.5,
            name: 'bottom',
        });
        group.addChild(bottom);

        // The stem of the seed is a gentle arc which pulls randomly to
        // one direction or the other. the height is specified by the caller.
        var stem = new Path();
        stem.strokeColor = seedStemColor;
        stem.strokeWidth = 1;
        stem.add(new Point(p.x + 2, p.y));

        var throughPoint = new Point(p.x + 4, p.y - stemHeight / 2);
        var toPoint = new Point(p.x + 3, p.y - stemHeight);
        stem.arcTo(throughPoint, toPoint);
        stem.name = 'stem';
        group.addChild(stem);

        /*
         * At the top of the stem are the wispy parts that stick out of the
         * top and catch the wind.  We draw a random number of wisps between
         * wispMin and wispMax.
         * 
         * Each wisp is an arc with a circle on top;
         */
        p = toPoint;
        var wispCount = random(wispMin, wispMax);

        for (var i = 0; i < wispCount; i++) {
            path = new Path();
            path.strokeColor = wispColor;
            path.strokeWidth = 1;
            
            var p1 = new Point(p.x, p.y);
            path.add(new Point(p1.x + 2, p1.y + 2));

            // Each wisp extends a random amount up in the air
            var y = random(1, 5);
            
            // Alternate wisps right and left to simulate dandelion
            // symmetry.
            var rand = random(1, 3);
            throughPoint = new Point(p1.x + (i & 1 ? -rand : rand), p1.y - y);
            rand = random(5, 35);
            toPoint = new Point(p1.x + (i & 1 ? -rand : rand), p1.y - 20 - y);

            path.arcTo(throughPoint, toPoint);
            group.addChild(path);

            // put a circle at the top of the wisp
            circle = new Path.Circle(toPoint, 2);
            circle.fillColor = wispColor;
            group.addChild(circle);
        }
        
        // This group contains all of the pieces of our seed so we can 
        // work with them as a unit. rotate the group around the bottom
        // of the seed.
        this.group = group;
        this.group.rotate(angle, bottom.position);

        // keep track of what angle the seed has been rotated to. because
        // the seed is constructed straight up it starts at -90/270 degrees.
        this.angle = coerce(-90 + angle);

        // the seed will rotate counter-clockwise by default
        this.direction = -1;

        // set where the seed will get blown to
        this.dest = new  Point(1800, random(-300, 1100));

    }

    // this function extends the stem so the stems that were attached in
    // the middle have a stem when they are 'blown' loose
    this.extendStem = function(stemHeight) {
        var stem = this.group.children['stem'];
        var cur = stem.segments[1].point - stem.segments[0].point;

        if (cur.length >= stemHeight) {
            return;
        }

        var delta = stemHeight - cur.length;
        stem.segments[0].point.x -= delta;
        this.group.children['bottom'].position.x -= delta;
    }

    // This function sets a seed to the detached state. The breeze blows
    // the seed to a 0 degree angle on detachment.
    this.detach = function() {
        // rotate the seed to zero degrees (wisps on right, seed on left)
        this.rotate(-this.angle);

        // TODO fix hardcoded stem length?
        this.extendStem(25);

        // the seed is not settled (rotated to wisps on top and seed on
        // bottom) yet. move counter-clockwise until it is.
        this.settled = false;
        this.direction = -1;

        return this;
    }

    //
    // This function rotates the seed around its center by the
    // specified angle.
    // 
    // @param angle degrees of rotation for this seed
    //
    this.rotate = function(angle) {
        this.group.rotate(angle);
        this.angle += angle;
        this.angle = coerce(this.angle);
    }

    //
    // This function rotates the seed angle degrees around its center
    // point.  This is what makes the seeds move across the screen and
    // approximates a floating motion.
    //
    // @param angle degrees to rotate the seed
    //
    this.rotateMove = function(angle) {
        // do accurate off screen check. could use heuristics but
        // this works and we only test seeds that are floating.
        if (this.group.bounds.topLeft.x > view.bounds.width ||
            this.group.bounds.bottomLeft.y < 0 ||
            this.group.bounds.topLeft.y > view.bounds.height) {
            this.isOffScreen = true;
            return;
        }

        // it's on screen so move it and rotate it so it looks like it's
        // blowing in the breeze
        var vector = this.dest - this.group.position;
        this.group.position += vector / 150;

        // once it's settled only move it one degree per frame so it
        // doesn't appear jerky. but it can settle faster than that.
        var angle = 1;
        if (!this.settled) {
            angle = random(1, 3);
        }
        this.rotate(this.direction * angle);

        // once it is mostly vertical gently oscillate back and forth
        if (this.direction === 1 && this.angle > 315) {
            this.direction = -1;
        } else if (this.direction === -1 && this.angle < 280) {
            this.settled = true;
            this.direction = 1;
        }
    }
}

// control whether to detach seeds and execute onFrame events
var started = false;

// keep track of where seeds are
var seeds = {attached: [], floating: [], offscreen: []};

//
// Initialize paper and the dandelion
//
function init() {
    // Save the paperscope object so it can be used later for
    // the in-place code editing
    codeMgr.scope = paper;
    
    $('#edit').click(function(evt) {
        started = false;
    });
    
    //
    // The stem of the dandelion is a thick green arcing line.
    //
    var path = new Path();
    path.strokeColor = stemColor;
    path.strokeWidth = 5;
    
    var firstPoint = new Point(0, 550);
    path.add(firstPoint);
    
    var throughPoint = new Point(75, 400);
    var toPoint = new Point(100, 250);
    path.arcTo(throughPoint, toPoint);

    //
    // The bulb of the flower is a green circle.
    //
    var bulb = new Path.Circle(toPoint, 10);
    bulb.fillColor = stemColor;

    // Number of degrees per unit of the circumference of the bulb
    var angle = 360 / bulb.length;

    // get the normal for use in calculating the angle to rotate each seed
    // so the seed sticks out from the bulb.
    var normal = bulb.getNormalAt(0);
    
    //
    // The first set of seeds go around the perimeter of the bulb.
    // Each seed is rotated based on their location in the circle so they
    // always point out from the bulb.
    //
    var nSeeds = Math.min(bulb.length, maxEdgeSeeds);

    for (var i = 0; i < nSeeds; i++) {
        var seed = new Seed();
        var height = random(seedStemLow, seedStemHigh);
        seed.create(bulb.getPointAt(i), normal.angle/2 + (i * angle), height);
        seeds.attached.push(seed);
    }

    //console.log(seed.angle);

    //
    // Add another set of seeds to the middle of the bulb so to cover
    // the middle and make the dandelion look extra fluffy.
    //
    for (var i = 0; i < maxCenterSeeds; i++) {
        var seed = new Seed();
        seed.create(toPoint, random(0, 360), 2);
        seeds.attached.push(seed);
    }
    
    //
    // Kick off the animation after a delay
    //
    setTimeout(start, 1000);
}

//
// This function starts the animation.  It starts an interval timer that
// launches one seed per launchCounter intervals.
//
function start() {
    started = true;
    var launchCounter = random(1, 2);
    
    var id = setInterval(function() {
        // don't launch seeds when onFrame isn't running
        if (!started || !document.hasFocus()) {
            return;
        }

        if (--launchCounter > 0)
            return;

        // if the launchCounter has expired and seeds remain attached launch
        // one.
        if (seeds.attached.length) {
            var seedIndex = random(0, seeds.attached.length - 1);
            var seed = seeds.attached.splice(seedIndex, 1)[0];
            seeds.floating.push(seed.detach());
            //seeds.floating.push(seeds.attached.shift().detach());
            launchCounter = random(1, 2);
            return;
        }

        // no seeds remain attached, stop this interval timer
        clearInterval(id);
    }, 500);
}

//
// This function helps with debugging.  Stop and start
// the animation whenever the mouse is clicked.
//
function onMouseUp(event) {
    started = !started;
}

//
// This function is called with each frame of the animation. It animates
// the seeds that are floating.
//
function onFrame(event) {
    if (started && seeds.floating.length) {
        var i = 0;

        while (i < seeds.floating.length) {
            // if the seed is offscreen remove it from the floating array
            // and add it to the offscreen seeds. don't increment the index
            // because the length is now one shorter than it used to be and
            // the index refers to the item past the one just removed.
            if (seeds.floating[i].isOffScreen) {
                seeds.offscreen.push(seeds.floating.splice(i, 1));
                continue;
            }
            // this seed stays in the floating seeds array so rotate it then
            // increment the index to check on the next seed.
            seeds.floating[i].rotateMove();
            i += 1;
        }
    }
}

init();
