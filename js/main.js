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

    $(function() {
        $('#calc').click(function(){
            var lhs = getMolecule('lhs');
            var rhs = getMolecule('rhs');
            var conf = getConfig();

            var result = conf.method(
                lhs, rhs, conf.percentage, conf.threshold
            );

            var $result = $('#result');
            $result.empty();
            $result.append(sprintf('<h3>Recipe of %f%% solution</h3>', conf.percentage));
            $result.append(sprintf('<h4>Information of %s</h4>', lhs.name));
            $result.append(sprintf([
                '<p><span class="name">The number of molecules required</span>',
                '<span class="value">%d (%.2f)</span></p>',
            ].join(''), result[0].toNumber(), result[0].toNumber()));
            $result.append(sprintf([
                '<p><span class="name">The estimated volume [m<sup>3</sup>]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), lhs.toVolume(result[0])));
            $result.append(sprintf([
                '<p><span class="name">The estimated weight [g]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), lhs.toWeight(result[0])));
            $result.append(sprintf('<h4>Information of %s</h4>', rhs.name));
            $result.append(sprintf([
                '<p><span class="name">The number of molecules required</span>',
                '<span class="value">%d (%.2f)</span></p>',
            ].join(''), result[1].toNumber(), result[1].toNumber()));
            $result.append(sprintf([
                '<p><span class="name">The estimated volume [m<sup>3</sup>]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), rhs.toVolume(result[1])));
            $result.append(sprintf([
                '<p><span class="name">The estimated weight [g]</span>',
                '<span class="value">%e</span></p>',
            ].join(''), rhs.toWeight(result[1])));
        }).removeAttr('disabled');
    });
});
