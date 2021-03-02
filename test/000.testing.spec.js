const { expect } = require('chai');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

describe('EVM/OVM features', () => {
	before(async () => {
		this.wallets = await ethers.getSigners();
	})

	beforeEach(async () => {})

	describe('EIP-155', async () => {
		it ('factory deployment', async () => {
			this.factory = await deploy('GenericFactory')
		})

		it ('factory usage', async () => {
			const Testing  = await ethers.getContractFactory('Testing')
			const salt     = ethers.utils.randomBytes(32)
			const expected = await this.factory.predictAddress(Testing.bytecode, salt)

			await expect(this.factory.createContract(Testing.bytecode, salt)).to.emit(this.factory, 'NewContract').withArgs(expected)

			this.instance = new ethers.Contract(expected, Testing.interface, this.wallets[0])
		})
	})

	describe('precompiles', async () => {
		it('recover', async () => {
			const signer    = new ethers.Wallet.createRandom();
			const hash      = ethers.utils.randomBytes(32)
			const signature = await signer.signMessage(ethers.utils.arrayify(hash))
			expect(await this.instance.recover(hash, signature)).to.equal(signer.address)
		})
	})
});
