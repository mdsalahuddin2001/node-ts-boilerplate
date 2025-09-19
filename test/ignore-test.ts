import * as request from 'supertest'
describe('Ignore Test', () => {
  it('should return 200 OK', async () => {
    const response = await request('http://localhost:4000').get('/health')
    expect(response.status).toBe(200)
  })
})
