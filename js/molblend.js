define(function(require) {
    var undefined;  // make sure that the 'undefined' is undefined;
    var Decimal = require('http://rawgit.com/MikeMcl/decimal.js/master/decimal.min.js');
    var Molecule = function(name, mweight, density) {
        this.name = name;
        this.mweight = new Decimal(mweight);    // molecular weight [g/mol]
        this.density = new Decimal(density);    // density [g/cm^3]
        // coefficient [mol/m^3] := density [g/cm^3] * 10^6 / mweight [g/mol]
        this.coefficient = this.density.times(new Decimal(10).pow(6)).div(this.mweight);
    };
    Molecule.prototype.toVolume = function(n) {
        // volume [m^3] := n / AVOGADRO / coefficient [mol/m^3]
        var A = new Decimal('6.02214075e+23');
        var n = new Decimal(n);
        return n.div(A).div(this.coefficient);
    };
    Molecule.prototype.toWeight = function(n) {
        // weight [g] := n / AVOGADRO * mweight [g/mol]
        var A = new Decimal('6.02214075e+23');
        var n = new Decimal(n);
        return n.div(A).times(this.mweight);
    };
    Molecule.prototype.fromVolume = function(volume) {
        // n = volume [m^3] * AVOGADRO * coefficient [mol/m^3]
        var A = new Decimal('6.02214075e+23');
        var v = new Decimal(volume);
        return volume.times(A).times(this.coefficient);
    };
    Molecule.prototype.fromWeight = function(weight) {
        // n = weight [g] * AVOGADRO / mweight [g/mol]
        var A = new Decimal('6.02214075e+23');
        var weight = new Decimal(weight);
        return weight.times(A).div(this.mweight);
    };

    var blend = function(expr, solute, solvent, percentage, threshold) {
        percentage = new Decimal(percentage);
        threshold = new Decimal(threshold === undefined ? '0.01' : threshold)
        var k = percentage.div((new Decimal(100)).minus(percentage));
        var K = (new Decimal(1)).div(k);
        var n = new Decimal(1);
        while (true) {
            // guess solvent_n from solute_n
            solvent_t = expr(n, solute, solvent, k);
            if (solvent_t.round().minus(solvent_t).abs().lessThan(threshold)) {
                solute_n = n;
                solvent_n = solvent_t;
                break;
            }
            // guess solute_n from solvent_n (opposite way)
            solute_t = expr(n, solvent, solute, K);
            if (solute_t.round().minus(solute_t).abs().lessThan(threshold)) {
                solute_n = solute_t;
                solvent_n = n;
                break;
            }
            n = n.plus(1);
        }
        return [solute_n, solvent_n];
    };
    var blendVV = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for volume(solute)/volume(solvent)
        //
        // solute_v [m^3] : solvent_v [m^3] = (100 - percentage) : percentage
        // solvent_v [m^3] = percentage * solute_v [m^3] / (100 - percentage)
        // solute_v [m^3] = solute_n / AVOGADRO / solute_e [mol/m^3]
        // solvent_v [m^3] = solvent_n / AVOGADRO / solvent_e [mol/m^3]
        // (solvent_n / AVOGADRO / solvent_e [mol/m^3]) = percentage * (solute_n / AVOGADRO / solute_e [mol/m^3]) / (100 - percentage)
        // solvent_n = (solvent_e [mol/m^3] / solute_e [mol/m^3]) * (percentage / (100 - percentage)) * solute_n
        // solvent_n = m * k * solute_n
        var expr = function(solute_n, solute, solvent, k) {
            var m = solvent.coefficient.div(solute.coefficient);
            return m.times(k).times(solute_n);
        };
        return blend(expr, solute, solvent, percentage, threshold);
    };
    var blendWW = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for weight(solute)/weight(solvent)
        //
        // solute_w [g] : solvent_w [g] = (100 - percentage) : percentage
        // solvent_w [g] = percentage * solute_w [g] / (100 - percentage)
        // solute_w [g] = solute_n / AVOGADRO * solute_m [g/mol]
        // solvent_w [g] = solvent_n / AVOGADRO * solvent_m [g/mol]
        // (solvent_n / AVOGADRO * solvent_m [g/mol]) = percentage * (solute_n / AVOGADRO * solute_m [g/mol]) / (100 - percentage)
        // solvent_n = (solute_m [g/mol] / solvent_m [g/mol]) * (percentage / (100 - percentage)) * solute_n
        // solvent_n = m * k * solute_n
        var expr = function(solute_n, solute, solvent, k) {
            var m = solute.mweight.div(solvent.mweight);
            return m.times(k).times(solute_n);
        };
        return blend(expr, solute, solvent, percentage, threshold);
    };
    var blendWV = function(solute, solvent, percentage, threshold) {
        // Calculate required number of combination for weight(solute)/volume(solvent)
        //
        // solute_w [g] : solvent_v [m^3] = (100 - percentage) : percentage
        // solvent_v [m^3] = percentage * solute_w [g] / (100 - percentage)
        // solute_w [g] = solute_n / AVOGADRO * solute_m [g/mol]
        // solvent_v [m^3] = solvent_n / AVOGADRO / solvent_e [mol/m^3]
        // (solvent_n / AVOGADRO / solvent_e [mol/m^3]) = percentage * (solute_n / AVOGADRO * solute_m [g/mol]) / (100 - percentage)
        // solvent_n = (solute_m [g/mol] * solvent_e [mol/m^3]) * (percentage / (100 - percentage)) * solute_n
        // solvent_n = m * k * solute_n
        var expr = function(solute_n, solute, solvent, k) {
            var m = solvent.coefficient.times(solute.mweight);
            return m.times(k).times(solute_n);
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
