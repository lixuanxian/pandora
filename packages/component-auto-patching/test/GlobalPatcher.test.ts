import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { GlobalPatcher } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import ComponentErrorLog from 'pandora-component-error-log';
import { fork } from './TestUtil';
import * as semver from 'semver';
import { consoleLogger } from 'pandora-dollar';

describe.only('ComponentAutoPatching -> GlobalPatcher', function () {
  let autoPatching, componentTrace, componentErrorLog, ctx: any;

  before(async () => {
    ctx = {
      config: {
        errorLog: {}
      }
    };

    componentErrorLog = new ComponentErrorLog(ctx);
    await componentErrorLog.start();

    Object.assign(ctx.config, {
      trace: {
        kTracer: PandoraTracer
      }
    });

    componentTrace = new ComponentTrace(ctx);
    await componentTrace.start();

    ctx.errorLogManager = componentErrorLog.errorLogManager;

    Object.assign(ctx.config, {
      autoPatching: {
        patchers: {
          global: {
            enabled: true,
            klass: GlobalPatcher
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);
    await autoPatching.start();
  });

  it('should only load global patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load global patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      global: {
        enabled: false,
        klass: GlobalPatcher
      }
    });

    await autoPatching.start();

    let instances = autoPatching.instances;
    expect(instances.size).to.equal(0);

    await autoPatching.stop();
    stub.restore();
    await autoPatching.start();

    instances = autoPatching.instances;
    expect(instances.size).to.equal(1);
  });

  it('should not load because errorLogManager is null', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(ctx, 'errorLogManager').value(null);
    const spy = sinon.spy(consoleLogger, 'error');

    await autoPatching.start();

    expect(spy.calledWith(sinon.match('pandora-component-error-log is need.'))).to.be.true;

    await autoPatching.stop();
    stub.restore();
    spy.restore();
    await autoPatching.start();
  });

  it('should record console error and warn', (done) => {
    fork('global/GlobalConsole', done);
  });

  it('should not record console error when deal with unhandled', (done) => {
    fork('global/GlobalConsoleUnhandled', done);
  });

  it('should work well when error log collect error', (done) => {
    fork('global/GlobalConsoleError', done);
  });

  it('should record fatal error', (done) => {
    fork('global/GlobalFatal', done);
  });
});