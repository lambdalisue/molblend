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

    var blend = function(expr, lhs, rhs, percentage, threshold) {
        percentage = new Decimal(percentage);
        threshold = new Decimal(threshold === undefined ? '0.01' : threshold)
        var k = percentage.div((new Decimal(100)).minus(percentage));
        var K = (new Decimal(1)).div(k);
        var n = new Decimal(1);
        while (true) {
            // guess rhs_n from lhs_n
            rhs_t = expr(n, lhs, rhs, k);
            if (rhs_t.round().minus(rhs_t).abs().lessThan(threshold)) {
                lhs_n = n;
                rhs_n = rhs_t;
                break;
            }
            // guess lhs_n from rhs_n (opposite way)
            lhs_t = expr(n, rhs, lhs, K);
            if (lhs_t.round().minus(lhs_t).abs().lessThan(threshold)) {
                lhs_n = lhs_t;
                rhs_n = n;
                break;
            }
            n = n.plus(1);
        }
        return [lhs_n, rhs_n];
    };
    var blendVV = function(lhs, rhs, percentage, threshold) {
        // Calculate required number of combination for volume(lhs)/volume(rhs)
        //
        // lhs_v [m^3] : rhs_v [m^3] = (100 - percentage) : percentage
        // rhs_v [m^3] = percentage * lhs_v [m^3] / (100 - percentage)
        // lhs_v [m^3] = lhs_n / AVOGADRO / lhs_e [mol/m^3]
        // rhs_v [m^3] = rhs_n / AVOGADRO / rhs_e [mol/m^3]
        // (rhs_n / AVOGADRO / rhs_e [mol/m^3]) = percentage * (lhs_n / AVOGADRO / lhs_e [mol/m^3]) / (100 - percentage)
        // rhs_n = (rhs_e [mol/m^3] / lhs_e [mol/m^3]) * (percentage / (100 - percentage)) * lhs_n
        // rhs_n = m * k * lhs_n
        var expr = function(lhs_n, lhs, rhs, k) {
            var m = rhs.coefficient.div(lhs.coefficient);
            return m.times(k).times(lhs_n);
        };
        return blend(expr, lhs, rhs, percentage, threshold);
    };
    var blendWW = function(lhs, rhs, percentage, threshold) {
        // Calculate required number of combination for weight(lhs)/weight(rhs)
        //
        // lhs_w [g] : rhs_w [g] = (100 - percentage) : percentage
        // rhs_w [g] = percentage * lhs_w [g] / (100 - percentage)
        // lhs_w [g] = lhs_n / AVOGADRO * lhs_m [g/mol]
        // rhs_w [g] = rhs_n / AVOGADRO * rhs_m [g/mol]
        // (rhs_n / AVOGADRO * rhs_m [g/mol]) = percentage * (lhs_n / AVOGADRO * lhs_m [g/mol]) / (100 - percentage)
        // rhs_n = (lhs_m [g/mol] / rhs_m [g/mol]) * (percentage / (100 - percentage)) * lhs_n
        // rhs_n = m * k * lhs_n
        var expr = function(lhs_n, lhs, rhs, k) {
            var m = lhs.mweight.div(rhs.mweight);
            return m.times(k).times(lhs_n);
        };
        return blend(expr, lhs, rhs, percentage, threshold);
    };
    var blendWV = function(lhs, rhs, percentage, threshold) {
        // Calculate required number of combination for weight(lhs)/volume(rhs)
        //
        // lhs_w [g] : rhs_v [m^3] = (100 - percentage) : percentage
        // rhs_v [m^3] = percentage * lhs_w [g] / (100 - percentage)
        // lhs_w [g] = lhs_n / AVOGADRO * lhs_m [g/mol]
        // rhs_v [m^3] = rhs_n / AVOGADRO / rhs_e [mol/m^3]
        // (rhs_n / AVOGADRO / rhs_e [mol/m^3]) = percentage * (lhs_n / AVOGADRO * lhs_m [g/mol]) / (100 - percentage)
        // rhs_n = (lhs_m [g/mol] * rhs_e [mol/m^3]) * (percentage / (100 - percentage)) * lhs_n
        // rhs_n = m * k * lhs_n
        var expr = function(lhs_n, lhs, rhs, k) {
            var m = rhs.coefficient.times(lhs.mweight);
            return m.times(k).times(lhs_n);
        };
        return blend(expr, lhs, rhs, percentage, threshold);
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
