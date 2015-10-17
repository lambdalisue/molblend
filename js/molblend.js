define(function(require) {
    var undefined;  // make sure that the 'undefined' is undefined;
    var Decimal = require('http://rawgit.com/MikeMcl/decimal.js/master/decimal.min.js');
    var Avogadro = new Decimal('6.02214075e+23');
    var Handled = new Decimal('100');
    var Molecule = function(name, mweight, density) {
        this.name = name;
        this.mweight = new Decimal(mweight);    // molecular weight [g/mol]
        this.density = new Decimal(density);    // density [g/cm^3]
        // L = 10^{-3} m^3 = 1000 cm^3
        // coefficient [mol/mL] := coefficient [mol/cm^3] = density [g/cm^3] / mweight [g/mol]
        this.coefficient = this.density.div(this.mweight);
    };
    Molecule.prototype.toVolume = function(n) {
        // volume [mL] := n / AVOGADRO / coefficient [mol/mL]
        var n = new Decimal(n);
        return n.div(Avogadro).div(this.coefficient);
    };
    Molecule.prototype.toWeight = function(n) {
        // weight [g] := n / AVOGADRO * mweight [g/mol]
        var n = new Decimal(n);
        return n.div(Avogadro).times(this.mweight);
    };
    Molecule.prototype.fromVolume = function(volume) {
        // n = volume [mL] * AVOGADRO * coefficient [mol/mL]
        var v = new Decimal(volume);
        return volume.times(Avogadro).times(this.coefficient);
    };
    Molecule.prototype.fromWeight = function(weight) {
        // n = weight [g] * AVOGADRO / mweight [g/mol]
        var weight = new Decimal(weight);
        return weight.times(Avogadro).div(this.mweight);
    };

    var blend = function(expr, solute, solvent, percentage, threshold) {
        threshold = new Decimal(threshold === undefined ? '0.01' : threshold)
        var n = new Decimal(1);
        while (true) {
            solvent_t = expr(n);
            if (solvent_t.round().minus(solvent_t).abs().lessThan(threshold)) {
                solute_n = n;
                solvent_n = solvent_t;
                break;
            }
            n = n.plus(1);
        }
        return [solute_n, solvent_n];
    };
    var blendVV = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for volume(solute)/volume(solvent)
        percentage = new Decimal(percentage);
        var k = Handled.div(percentage).minus(1);
        var m = solvent.coefficient.div(solute.coefficient);
        var expr = function(N) {
            return k.times(m).times(N);
        };
        return blend(expr, solute, solvent, percentage, threshold);
    };
    var blendWW = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for weight(solute)/weight(solvent)
        percentage = new Decimal(percentage);
        var k = Handled.div(percentage).minus(1);
        var m = solute.mweight.div(solvent.mweight);
        var expr = function(N) {
            return k.times(m).times(N);
        };
        return blend(expr, solute, solvent, percentage, threshold);
    };
    var blendWV = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for weight(solute)/volume(solvent)
        percentage = new Decimal(percentage);
        var k = Handled.div(percentage);
        var m = solute.mweight.times(solvent.coefficient);
        var n = solvent.coefficient.div(solute.coefficient);
        var expr = function(N) {
            return k.times(m).times(N).minus(n.times(N));
        };
        return blend(expr, solute, solvent, percentage, threshold);
    };

    // export 'molblend' to the global namespace
    var exports = {};
    exports.Molecule = Molecule;
    exports.blend = blend;
    exports.blendVV = blendVV;
    exports.blendWW = blendWW;
    exports.blendWV = blendWV;
    return exports;
});
