var FSM;

describe("constructor", function () {
    it("requires an arguments Object", function () {
        chai.expect(function () {
            new FullScreenMario();
        }).to.throw("No arguments Object given to FullScreenMario.");
    });

    it("requires at least a width and height", function () {
        chai.expect(function () {
            new FullScreenMario({});
        }).to.throw("FullScreenMario requires both width and height.");
    });

    it("runs with a small screen size", function () {
        FSM = new FullScreenMario({
            "width": 512,
            "height": 464
        });
    });

    it("runs with a large screen size", function () {
        FSM = new FullScreenMario({
            "width": 2048,
            "height": 1152
        });
    });
});