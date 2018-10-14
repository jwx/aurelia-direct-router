
import { hydrateCustomAttribute } from '../behavior-assistance';
import { createScope } from '../scope-assistance';
import { ViewFake } from '../fakes/view-fake';
import {
  If,
  Else,
  IView,
  BindingFlags,
  IAttach,
  Lifecycle,
  LifecycleFlags,
  ForOfStatement,
  BindingIdentifier,
  AccessScope,
  AccessMember,
  ViewFactory,
  RuntimeBehavior,
  ObserverLocator,
  ChangeSet,
  IChangeSet
} from '../../../../src/index';
import { MockTextNodeTemplate } from '../../mock';
import { eachCartesianJoinFactory } from '../../../../../../scripts/test-lib';
import { createScopeForTest } from '../../binding/shared';
import { expect } from 'chai';
import { DI } from '@aurelia/kernel';

describe('The "if" template controller', () => {
  it("renders its view when the value is true", () => {
    const { attribute: ifAttr, location, cs } = hydrateCustomAttribute(If);

    ifAttr.value = true;
    ifAttr.$bind(BindingFlags.fromBind, createScope());

    const child = getCurrentView(ifAttr);
    const ifView = ifAttr['ifView'] as IView;

    expect(child).to.not.be.null;
    expect(child).to.equal(ifView);
    expect(ifView).to.be.instanceof(ViewFake);
    expect(ifView.$isBound).to.be.true;
    expect(ifView.$isAttached).to.be.false;

    runAttachLifecycle(cs, ifAttr);

    expect(ifView.$isAttached).to.be.true;
    expect(location.previousSibling)
      .to.equal(ifView.$nodes.lastChild);
  });

  it("queues the view removal via the changeSet when the value is false", () => {
    const { attribute: ifAttr, location, cs } = hydrateCustomAttribute(If);

    ifAttr.value = true;
    ifAttr.$bind(BindingFlags.fromBind, createScope());
    runAttachLifecycle(cs, ifAttr);

    const childBefore = getCurrentView(ifAttr);
    const prevSiblingBefore = location.previousSibling;

    ifAttr.value = false;

    let ifView = ifAttr['ifView'] as IView;
    expect(ifView.$isAttached).to.be.true;
    expect(ifView.$isBound).to.be.true;

    const childAfter = getCurrentView(ifAttr);
    expect(childAfter).to.equal(childBefore);
    expect(location.previousSibling).to.equal(prevSiblingBefore);
    expect(cs.size).to.equal(1);

    cs.flushChanges();

    const child = getCurrentView(ifAttr);
    expect(child).to.be.null;
    expect(location.previousSibling).to.be.null;

    ifView = ifAttr['ifView'] as IView;
    expect(ifView.$isAttached).to.be.false;
    expect(ifView.$isBound).to.be.false;
  });

  it("queues the rendering of an else view when one is linked and its value is false", () => {
    const container = DI.createContainer();
    const { attribute: ifAttr, location } = hydrateCustomAttribute(If, { container });
    const { attribute: elseAttr, cs } = hydrateCustomAttribute(Else, { container });

    elseAttr.link(ifAttr);

    ifAttr.value = true;
    ifAttr.$bind(BindingFlags.fromBind, createScope());
    ifAttr.value = false;

    let child = getCurrentView(ifAttr);
    let elseView = ifAttr['elseView'] as IView;

    expect(child).to.not.be.null;
    expect(elseView).to.be.null;

    cs.flushChanges();

    child = getCurrentView(ifAttr);
    elseView = ifAttr['elseView'] as IView;
    expect(child).to.not.be.null;
    expect(child).to.equal(elseView);
    expect(elseView).to.be.instanceof(ViewFake);
    expect(elseView.$isBound).to.be.true;
    expect(elseView.$isAttached).to.be.false;

    runAttachLifecycle(cs, ifAttr);

    expect(elseView.$isAttached).to.be.true;
    expect(location.previousSibling)
      .to.equal(elseView.$nodes.lastChild);
  });

  it("detaches its child view when it is detached", () => {
    const { attribute: ifAttr, cs } = hydrateCustomAttribute(If);

    ifAttr.value = true;
    ifAttr.$bind(BindingFlags.fromBind, createScope());

    const ifView = ifAttr['ifView'] as IView;

    runAttachLifecycle(cs, ifAttr);
    runDetachLifecycle(cs, ifAttr);

    expect(ifView.$isAttached).to.be.false;
    expect(ifAttr.$isAttached).to.be.false;
  });

  it("unbinds its child view when it is unbound", () => {
    const { attribute: ifAttr } = hydrateCustomAttribute(If);

    ifAttr.value = true;
    ifAttr.$bind(BindingFlags.fromBind, createScope());

    const ifView = ifAttr['ifView'] as IView;

    ifAttr.$unbind(BindingFlags.fromUnbind);

    expect(ifView.$isBound).to.be.false;
    expect(ifAttr.$isBound).to.be.false;
  });

  function getCurrentView(ifAttr: If) {
    return ifAttr['coordinator']['currentView'];
  }

  function runAttachLifecycle(changeSet: IChangeSet, item: IAttach) {
    const attachLifecycle = Lifecycle.beginAttach(changeSet, null, LifecycleFlags.none);
    attachLifecycle.attach(item);
    attachLifecycle.end();
  }

  function runDetachLifecycle(changeSet: IChangeSet, item: IAttach) {
    const detachLifecycle = Lifecycle.beginDetach(changeSet, LifecycleFlags.none);
    detachLifecycle.detach(item);
    detachLifecycle.end();
  }
});



const expressions = {
  text: new AccessMember(new AccessScope('item'), 'text'),
  if: new AccessMember(new AccessScope('item'), 'if'),
  else: new AccessMember(new AccessScope('item'), 'else'),
  show: new AccessScope('show'),
  items: new ForOfStatement(new BindingIdentifier('item'), new AccessScope('items'))
};


export class MockIfTextNodeTemplate {

}


function setup() {
  const cs = new ChangeSet();
  const host = document.createElement('div');
  const ifLoc = document.createComment('au-loc');
  host.appendChild(ifLoc);

  const observerLocator = new ObserverLocator(cs, null, null, null);
  const ifFactory = new ViewFactory(null, <any>new MockTextNodeTemplate(expressions.if, observerLocator));
  const elseFactory = new ViewFactory(null, <any>new MockTextNodeTemplate(expressions.else, observerLocator));

  const ifSut = new If(cs, ifFactory, ifLoc);
  const elseSut = new Else(elseFactory);

  elseSut.link(ifSut);

  (<any>ifSut)['$isAttached'] = false;
  (<any>ifSut)['$isBound'] = false;
  (<any>ifSut)['$scope'] = null;

  (<any>elseSut)['$isAttached'] = false;
  (<any>elseSut)['$isBound'] = false;
  (<any>elseSut)['$scope'] = null;

  const ifBehavior = RuntimeBehavior.create(<any>If, ifSut);
  ifBehavior.applyTo(ifSut, cs);

  const elseBehavior = RuntimeBehavior.create(<any>Else, <any>elseSut);
  elseBehavior.applyTo(<any>elseSut, cs);

  return { ifSut, elseSut, host, cs };
}

describe(`If/Else`, () => {

  eachCartesianJoinFactory([
    // initial input items
    <(() => [any, boolean, string, string, string])[]>[
      () => [{if:1,else:2},  1,         `1`, `2`, `{if:1,else:2},value:1        `],
      () => [{if:1,else:2},  2,         `1`, `2`, `{if:1,else:2},value:2        `],
      () => [{if:1,else:2},  {},        `1`, `2`, `{if:1,else:2},value:{}       `],
      () => [{if:1,else:2},  true,      `1`, `2`, `{if:1,else:2},value:true     `],
      () => [{if:1,else:2},  '1',       `1`, `2`, `{if:1,else:2},value:'1'      `],
      () => [{if:1,else:2},  '0',       `1`, `2`, `{if:1,else:2},value:'0'      `],
      () => [{if:1,else:2},  'true',    `1`, `2`, `{if:1,else:2},value:'true'   `],
      () => [{if:1,else:2},  'false',   `1`, `2`, `{if:1,else:2},value:'false'  `],
      () => [{if:1,else:2},  Symbol(),  `1`, `2`, `{if:1,else:2},value:Symbol() `],
      () => [{if:1,else:2},  -1,        `1`, `2`, `{if:1,else:2},value:-1       `],
      () => [{if:1,else:2},  NaN,       `1`, `2`, `{if:1,else:2},value:NaN      `],
      () => [{if:1,else:2},  0,         `1`, `2`, `{if:1,else:2},value:0        `],
      () => [{if:1,else:2},  '',        `1`, `2`, `{if:1,else:2},value:''       `],
      () => [{if:1,else:2},  false,     `1`, `2`, `{if:1,else:2},value:false    `],
      () => [{if:1,else:2},  null,      `1`, `2`, `{if:1,else:2},value:null     `],
      () => [{if:1,else:2},  undefined, `1`, `2`, `{if:1,else:2},value:undefined`]
    ],
    // first operation "execute1" (initial bind + attach)
    <(($1: [any, boolean, string, string, string]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => void, string])[]>[

      ([item, value, trueValue, falseValue]) => [(ifSut, elseSut, host, cs) => {
        ifSut.value = value;
        ifSut.$bind(BindingFlags.fromBind, createScopeForTest({ item }));

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal('', `execute1, host.textContent`);

        Lifecycle.beginAttach(cs, host, LifecycleFlags.none).attach(ifSut).end();

        expect(host.textContent).to.equal('', `execute1, host.textContent`);

        cs.flushChanges();

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute1, host.textContent`);

      }, `$bind(fromBind)  -> $attach(none)`],

      ([item, value, trueValue, falseValue]) => [(ifSut, elseSut, host, cs) => {
        ifSut.value = value;
        ifSut.$bind(BindingFlags.fromBind | BindingFlags.fromFlushChanges, createScopeForTest({ item }));

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal('', `execute1, host.textContent`);

        Lifecycle.beginAttach(cs, host, LifecycleFlags.none).attach(ifSut).end();

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute1, host.textContent`);

      }, `$bind(fromFlush) -> $attach(none)`]
    ],
    // second operation "execute2" (second bind or noop)
    <(($1: [any, boolean, string, string, string]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => void, string])[]>[

      ([,, trueValue, falseValue]) => [(ifSut: If, elseSut: Else, host: Node) => {
        ifSut.$bind(BindingFlags.fromBind, ifSut.$scope);

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute2, host.textContent`);

      }, `$bind(fromBind), same scope`],

      ([item,, trueValue, falseValue]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => {
        ifSut.$bind(BindingFlags.fromBind, createScopeForTest({ item }));

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute2, host.textContent`);

        cs.flushChanges();

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute2, host.textContent`);

      }, `$bind(fromBind), new scope `],

      ([item,, trueValue, falseValue]) => [(ifSut: If, elseSut: Else, host: Node) => {
        ifSut.$bind(BindingFlags.fromFlushChanges, createScopeForTest({ item }));

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute2, host.textContent`);

      }, `$bind(fromFlush), new scope`],

      ([,]) => [() => {

      }, `noop                       `]
    ],
    // third operation "execute3" (change value)
    <(($1: [any, boolean, string, string, string]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => void, string])[]>[

      ([,, trueValue, falseValue]) => [(ifSut, elseSut, host, cs) => {
        const contentBeforeChange = host.textContent;
        const oldValue = ifSut.value;
        const newValue = !ifSut.value;
        ifSut.value = newValue;
        ifSut.valueChanged(newValue, oldValue, undefined);

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(contentBeforeChange, `execute3, host.textContent`);

        cs.flushChanges();

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute3, host.textContent`);

      }, `ifSut.value=!ifSut.value`],

      ([,, trueValue, falseValue]) => [(ifSut, elseSut, host, cs) => {
        const contentBeforeChange = host.textContent;
        let oldValue = ifSut.value;
        let newValue = !ifSut.value;
        ifSut.value = newValue;
        ifSut.valueChanged(newValue, oldValue, undefined);

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(contentBeforeChange, `execute3, host.textContent`);

        oldValue = ifSut.value;
        newValue = !ifSut.value;
        ifSut.value = newValue;
        ifSut.valueChanged(newValue, oldValue, undefined);

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute3, host.textContent`);

        cs.flushChanges();

        expect(ifSut.coordinator['currentView'].$scope).to.equal(ifSut.$scope);
        expect(ifSut.coordinator['currentView'].$isBound).to.be.true;

        expect(host.textContent).to.equal(!!ifSut.value ? trueValue : falseValue, `execute3, host.textContent`);

      }, `ifSut.value=!ifSut.value(x2)`]
    ],
    // fourth operation "execute4" (detach and unbind)
    <(($1: [any, boolean, string, string, string]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => void, string])[]>[

      ([,,]) => [(ifSut, elseSut, host, cs) => {
        Lifecycle.beginDetach(cs, LifecycleFlags.none).detach(ifSut).end();

        expect(host.textContent).to.equal('', `execute4, host.textContent`);

        ifSut.$unbind(BindingFlags.fromUnbind);

        expect(host.textContent).to.equal('', `execute4, host.textContent`);

      }, `$detach(none)   -> $unbind(fromUnbind)`],

      ([,,]) => [(ifSut, elseSut, host, cs) => {
        Lifecycle.beginDetach(cs, LifecycleFlags.unbindAfterDetached).detach(ifSut).end();

        expect(host.textContent).to.equal('', `execute4, host.textContent`);

        ifSut.$unbind(BindingFlags.fromUnbind);

        expect(host.textContent).to.equal('', `execute4, host.textContent`);

      }, `$detach(unbind) -> $unbind(fromUnbind)`],
    ],
    // fifth operation "execute5" (second unbind)
    <(($1: [any, boolean, string, string, string]) => [(ifSut: If, elseSut: Else, host: Node, cs: ChangeSet) => void, string])[]>[

      ([,,]) => [(ifSut, elseSut, host) => {
        ifSut.$unbind(BindingFlags.fromUnbind);

        expect(host.textContent).to.equal('', `execute5, host.textContent`);

      }, `$unbind(fromUnbind)`]
    ]
  ], (
    [,,, text1],
    [exec1, exec1Text],
    [exec2, exec2Text],
    [exec3, exec3Text],
    [exec4, exec4Text],
    [exec5, exec5Text]) => {
    it(`assign=${text1} -> ${exec1Text} -> ${exec2Text} -> ${exec3Text} -> ${exec4Text} -> ${exec5Text}`, () => {
      const { ifSut, elseSut, host, cs } = setup();

      exec1(ifSut, elseSut, host, cs);
      exec2(ifSut, elseSut, host, cs);
      exec3(ifSut, elseSut, host, cs);
      exec4(ifSut, elseSut, host, cs);
      exec5(ifSut, elseSut, host, cs);
    });
  });
});
