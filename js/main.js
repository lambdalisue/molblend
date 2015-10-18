define(function(require) {
    var undefined;  // make sure that the 'undefined' is undefined;
    var molblend = require('js/molblend.js');
    var sprintf = require('http://rawgit.com/alexei/sprintf.js/master/src/sprintf.js').sprintf;

    var getMolecule = function(prefix) {
        var name = $('#' + prefix + '-name').val() || $('#' + prefix + '-name').attr('placeholder');
        var mweight = $('#' + prefix + '-mweight').val();
        var density = $('#' + prefix + '-density').val();
        return new molblend.Molecule(name, mweight, density);
    };

    var getConfig = function() {
        var percentage = $('#percentage').val();
        var method = $('#method').val();
        var threshold = $('#threshold').val() || $('#threshold').attr('placeholder');
        return {
            percentage: percentage,
            method: molblend['blend' + method],
            threshold: threshold,
        };
    };

    Object.defineProperty(molblend, 'Solute', {
        get: function() { return getMolecule('solute'); },
    });
    Object.defineProperty(molblend, 'Solvent', {
        get: function() { return getMolecule('solvent'); },
    });

    // expose
    window.molblend = molblend;

    $(function() {
        $('#calculator').on('submit', function(e){
            var solute = molblend.Solute;
            var solvent = molblend.Solvent;
            var conf = getConfig();

            var result = conf.method(
                solute, solvent, conf.percentage, conf.threshold
            );

            var solute_n = result[0].round().toNumber();
            var solvent_n = result[1].round().toNumber();

            var $result = $('#result');
            $result.empty();
            $result.append(sprintf('<h3>Recipe of %f%% %s solution</h3>', conf.percentage, solute.name));
            $result.append(sprintf([
                '<p><span class="name">The total number of molecules</span>',
                '<span class="value">%d (%.2f)</span></p>',
            ].join(''), solute_n + solvent_n, result[0].plus(result[1]).toNumber()));
            $result.append(sprintf([
                '<p><span class="name">The estimated total volume [mL]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solute.toVolume(solute_n).plus(solvent.toVolume(solvent_n))));
            $result.append(sprintf([
                '<p><span class="name">The estimated total weight [g]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solute.toWeight(solute_n).plus(solvent.toWeight(solvent_n))));
            $result.append(sprintf('<h4>Information of %s (solute)</h4>', solute.name));
            $result.append(sprintf([
                '<p><span class="name">The number of molecules required</span>',
                '<span class="value">%d (%.2f)</span></p>',
            ].join(''), solute_n, result[0].toNumber()));
            $result.append(sprintf([
                '<p><span class="name">The estimated volume [mL]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solute.toVolume(solute_n)));
            $result.append(sprintf([
                '<p><span class="name">The estimated weight [g]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solute.toWeight(solute_n)));
            $result.append(sprintf('<h4>Information of %s (solvent)</h4>', solvent.name));
            $result.append(sprintf([
                '<p><span class="name">The number of molecules required</span>',
                '<span class="value">%d (%.2f)</span></p>',
            ].join(''), solvent_n, result[1].toNumber()));
            $result.append(sprintf([
                '<p><span class="name">The estimated volume [mL]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solvent.toVolume(solvent_n)));
            $result.append(sprintf([
                '<p><span class="name">The estimated weight [g]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), solvent.toWeight(solvent_n)));


            e.preventDefault();
            return false;
        });
        $('#calc').removeAttr('disabled');
    });
});
